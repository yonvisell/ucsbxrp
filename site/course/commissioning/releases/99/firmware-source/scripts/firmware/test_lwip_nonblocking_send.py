"""Exercise the pinned native TCP send function with deterministic backpressure.

The maintained patch is applied to an exact upstream function excerpt, then the
result is compiled with host C stubs. No robot, socket, firmware build, or timing
sleep is used. Baseline failures demonstrate the two defects independently of
the patched implementation.
"""

import hashlib
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
PATCH = HERE / "lwip-nonblocking-send.patch"
FIXTURE = HERE / "fixtures/lwip_tcp_send_0fd6c573.c"
FUNCTION_SHA256 = "0496d90b7cd51e73c1b3aef04ab7e42fb6ca9e1ff65c96937459df5d38a0e723"

STUBS = r"""
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include <stdint.h>

typedef uintptr_t mp_uint_t;
typedef unsigned char byte;
typedef unsigned short u16_t;
typedef int err_t;
enum { ERR_OK = 0, ERR_MEM = -1, ERR_CONN = -11 };
enum { MP_EAGAIN = 11, MP_ENOMEM = 12, MP_ETIMEDOUT = 110, MP_ECONNRESET = 104 };
enum { STATE_CONNECTING = 1, STATE_CONNECTED = 2 };
#define MP_STREAM_ERROR ((mp_uint_t)-1)
#define TCP_WRITE_FLAG_COPY 1
#define MIN(a, b) ((a) < (b) ? (a) : (b))

struct tcp_pcb { unsigned available; };
typedef struct {
    union { struct tcp_pcb *tcp; } pcb;
    mp_uint_t timeout;
    int state;
} lwip_socket_obj_t;

static const int error_lookup_table[12] = { [1] = MP_ENOMEM, [11] = MP_ECONNRESET };
static int lock_depth, write_calls, output_calls, nagle_calls, delay_calls;
static unsigned elapsed_ms;
static err_t write_result = ERR_OK, output_result = ERR_OK;
static err_t write_sequence[8];
static unsigned write_sequence_length;
static byte accepted[128];
static unsigned accepted_length;

static void enter(void) { assert(lock_depth == 0); ++lock_depth; }
static void leave(void) { assert(lock_depth == 1); --lock_depth; }
#define MICROPY_PY_LWIP_ENTER enter();
#define MICROPY_PY_LWIP_REENTER enter();
#define MICROPY_PY_LWIP_EXIT leave();
#define STREAM_ERROR_CHECK(socket) do { \
    if ((socket)->state < 0) { *_errno = MP_ECONNRESET; return MP_STREAM_ERROR; } \
} while (0)
#define STREAM_ERROR_CHECK_WITH_LOCK(socket) do { \
    if ((socket)->state < 0) { leave(); *_errno = MP_ECONNRESET; return MP_STREAM_ERROR; } \
} while (0)

static unsigned tcp_sndbuf(struct tcp_pcb *pcb) { return pcb->available; }
static mp_uint_t mp_hal_ticks_ms(void) { return elapsed_ms; }
static void mp_hal_delay_ms(unsigned value) {
    assert(lock_depth == 0);
    ++delay_calls;
    elapsed_ms += value;
}
static void poll_sockets(void) { assert(!"unexpected blocking availability wait"); }
static err_t tcp_write(struct tcp_pcb *pcb, const byte *data, unsigned count, int flags) {
    assert(lock_depth == 1 && flags == TCP_WRITE_FLAG_COPY);
    err_t result = (unsigned)write_calls < write_sequence_length
        ? write_sequence[write_calls] : write_result;
    ++write_calls;
    if (result == ERR_OK) {
        assert(count <= pcb->available && accepted_length + count <= sizeof(accepted));
        memcpy(accepted + accepted_length, data, count);
        accepted_length += count;
        pcb->available -= count;
    }
    return result;
}
static err_t tcp_output(struct tcp_pcb *pcb) {
    (void)pcb;
    assert(lock_depth == 1);
    ++output_calls;
    return output_result;
}
static err_t tcp_output_nagle(struct tcp_pcb *pcb) {
    (void)pcb;
    assert(lock_depth == 1);
    ++nagle_calls;
    return ERR_OK;
}
"""

SCENARIOS = r"""
#define CHECK(condition) do { if (!(condition)) { \
    fprintf(stderr, "%s:%d: %s\n", argv[1], __LINE__, #condition); return 1; \
} } while (0)

int main(int argc, char **argv) {
    assert(argc == 2);
    struct tcp_pcb pcb = { .available = 64 };
    lwip_socket_obj_t socket = { .pcb.tcp = &pcb, .timeout = 0, .state = STATE_CONNECTED };
    const byte payload[] = "abcdef";
    int error = 0;
    mp_uint_t result;

    if (!strcmp(argv[1], "nonblocking_pressure")) {
        write_result = ERR_MEM;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_EAGAIN);
        CHECK(write_calls == 1 && delay_calls == 0 && output_calls == 0);
        CHECK(accepted_length == 0 && nagle_calls == 0);
    } else if (!strcmp(argv[1], "ordered_retry")) {
        pcb.available = 4;
        write_sequence[0] = ERR_MEM;
        write_sequence_length = 1;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_EAGAIN && accepted_length == 0);
        CHECK(lock_depth == 0);
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == 4 && accepted_length == 4);
        pcb.available = 4; /* The peer acknowledges data before a later retry. */
        result = lwip_tcp_send(&socket, payload + 4, 2, &error);
        CHECK(result == 2 && accepted_length == 6);
        CHECK(!memcmp(accepted, payload, 6));
        CHECK(write_calls == 3 && delay_calls == 0 && nagle_calls == 2);
    } else if (!strcmp(argv[1], "zero_available")) {
        pcb.available = 0;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_EAGAIN);
        CHECK(write_calls == 0 && delay_calls == 0 && accepted_length == 0);
    } else if (!strcmp(argv[1], "blocking_exhaustion")) {
        socket.timeout = -1;
        write_result = ERR_MEM;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_ENOMEM);
        CHECK(write_calls == 200 && output_calls == 200 && delay_calls == 200);
        CHECK(elapsed_ms == 10000 && accepted_length == 0 && nagle_calls == 0);
    } else if (!strcmp(argv[1], "blocking_recovery")) {
        socket.timeout = -1;
        write_sequence[0] = write_sequence[1] = ERR_MEM;
        write_sequence_length = 2;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == 6 && accepted_length == 6 && !memcmp(accepted, payload, 6));
        CHECK(write_calls == 3 && output_calls == 2 && delay_calls == 2);
        CHECK(elapsed_ms == 100 && nagle_calls == 1);
    } else if (!strcmp(argv[1], "output_error")) {
        socket.timeout = -1;
        write_result = ERR_MEM;
        output_result = ERR_CONN;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_ECONNRESET);
        CHECK(write_calls == 1 && output_calls == 1 && delay_calls == 0);
        CHECK(accepted_length == 0 && nagle_calls == 0);
    } else if (!strcmp(argv[1], "write_error")) {
        write_result = ERR_CONN;
        result = lwip_tcp_send(&socket, payload, 6, &error);
        CHECK(result == MP_STREAM_ERROR && error == MP_ECONNRESET);
        CHECK(write_calls == 1 && output_calls == 0 && delay_calls == 0);
        CHECK(accepted_length == 0 && nagle_calls == 0);
    } else {
        CHECK(!"unknown scenario");
    }
    CHECK(lock_depth == 0);
    return 0;
}
"""


def function_source(source):
    start = source.index("static mp_uint_t lwip_tcp_send(")
    end = source.index("\n}\n", start) + 3
    return source[start:end]


class LwipNonblockingSendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        compiler = shutil.which("cc") or shutil.which("clang") or shutil.which("gcc")
        if compiler is None:
            raise RuntimeError("A host C compiler is required for the native send regression")
        cls.temporary = tempfile.TemporaryDirectory(prefix="ucsb-lwip-send-")
        cls.addClassCleanup(cls.temporary.cleanup)
        cls.root = Path(cls.temporary.name)
        upstream = FIXTURE.read_text()
        actual_hash = hashlib.sha256(function_source(upstream).encode()).hexdigest()
        if actual_hash != FUNCTION_SHA256:
            raise AssertionError("The pinned upstream function fixture changed")
        destination = cls.root / "extmod/modlwip.c"
        destination.parent.mkdir()
        destination.write_text(upstream)
        subprocess.run(["git", "apply", "--check", str(PATCH)], cwd=cls.root, check=True,
                       capture_output=True, text=True)
        subprocess.run(["git", "apply", str(PATCH)], cwd=cls.root, check=True,
                       capture_output=True, text=True)
        for name, source in (("baseline", upstream), ("patched", destination.read_text())):
            harness = cls.root / (name + ".c")
            harness.write_text(STUBS + function_source(source) + SCENARIOS)
            # The pinned function compares its unsigned timeout with -1.
            compilation = subprocess.run(
                [compiler, "-std=c99", "-Wall", "-Wextra", "-Werror", "-Wno-sign-compare", "-O2",
                 str(harness), "-o", str(cls.root / name)], capture_output=True, text=True)
            if compilation.returncode:
                raise AssertionError(compilation.stderr)

    def run_scenario(self, name, baseline=False):
        result = subprocess.run([str(self.root / ("baseline" if baseline else "patched")), name],
                                capture_output=True, text=True, timeout=5)
        if baseline:
            self.assertEqual(result.returncode, 1, result.stderr)
        else:
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_nonblocking_pressure_returns_immediately_without_consuming_bytes(self):
        self.run_scenario("nonblocking_pressure")

    def test_later_retry_and_partial_write_preserve_byte_order_once(self):
        self.run_scenario("ordered_retry")

    def test_no_tcp_capacity_keeps_existing_nonblocking_behavior(self):
        self.run_scenario("zero_available")

    def test_blocking_retry_exhaustion_never_claims_unqueued_bytes(self):
        self.run_scenario("blocking_exhaustion")

    def test_blocking_retry_recovers_and_accepts_bytes_once(self):
        self.run_scenario("blocking_recovery")

    def test_terminal_output_error_preserves_errno_and_unlocks(self):
        self.run_scenario("output_error")

    def test_terminal_write_error_preserves_errno_and_unlocks(self):
        self.run_scenario("write_error")

    def test_baseline_reproduces_nonblocking_wait_and_false_success(self):
        self.run_scenario("nonblocking_pressure", baseline=True)
        self.run_scenario("blocking_exhaustion", baseline=True)


if __name__ == "__main__":
    unittest.main()
