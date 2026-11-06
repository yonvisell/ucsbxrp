/* Exact function excerpt from MicroPython extmod/modlwip.c, commit
 * 0fd6c573ea815774668bbb16b8e197c8822368b2 (v1.29.0).
 * Copyright (c) 2013-2019 Damien P. George; Copyright (c) 2015-2017
 * Paul Sokolovsky. MIT license, retained below from the pinned source.
 * https://github.com/micropython/micropython/blob/0fd6c573ea815774668bbb16b8e197c8822368b2/extmod/modlwip.c
 */
/*
 * This file is part of the MicroPython project, http://micropython.org/
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2019 Damien P. George
 * Copyright (c) 2015 Galen Hazelwood
 * Copyright (c) 2015-2017 Paul Sokolovsky
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

static mp_uint_t lwip_tcp_send(lwip_socket_obj_t *socket, const byte *buf, mp_uint_t len, int *_errno) {
    // Check for any pending errors
    STREAM_ERROR_CHECK(socket);

    MICROPY_PY_LWIP_ENTER

    // If the socket is still connecting then don't let data be written to it.
    // Otherwise, get the number of available bytes in the output buffer.
    u16_t available = 0;
    if (socket->state != STATE_CONNECTING) {
        available = tcp_sndbuf(socket->pcb.tcp);
    }

    if (available == 0) {
        // Non-blocking socket
        if (socket->timeout == 0) {
            MICROPY_PY_LWIP_EXIT
            *_errno = MP_EAGAIN;
            return MP_STREAM_ERROR;
        }

        mp_uint_t start = mp_hal_ticks_ms();
        // Assume that STATE_PEER_CLOSED may mean half-closed connection, where peer closed it
        // sending direction, but not receiving. Consequently, check for both STATE_CONNECTED
        // and STATE_PEER_CLOSED as normal conditions and still waiting for buffers to be sent.
        // If peer fully closed socket, we would have socket->state set to ERR_RST (connection
        // reset) by error callback.
        // Avoid sending too small packets, so wait until at least 16 bytes available
        while (socket->state == STATE_CONNECTING
               || (socket->state >= STATE_CONNECTED && (available = tcp_sndbuf(socket->pcb.tcp)) < 16)) {
            MICROPY_PY_LWIP_EXIT
            if (socket->timeout != -1 && mp_hal_ticks_ms() - start > socket->timeout) {
                *_errno = MP_ETIMEDOUT;
                return MP_STREAM_ERROR;
            }
            poll_sockets();
            MICROPY_PY_LWIP_REENTER
        }

        // While we waited, something could happen
        STREAM_ERROR_CHECK_WITH_LOCK(socket);
    }

    u16_t write_len = MIN(available, len);

    // If tcp_write returns ERR_MEM then there's currently not enough memory to
    // queue the write, so wait and keep trying until it succeeds (with 10s limit).
    // Note: if the socket is non-blocking then this code will actually block until
    // there's enough memory to do the write, but by this stage we have already
    // committed to being able to write the data.
    err_t err;
    for (int i = 0; i < 200; ++i) {
        err = tcp_write(socket->pcb.tcp, buf, write_len, TCP_WRITE_FLAG_COPY);
        if (err != ERR_MEM) {
            break;
        }
        err = tcp_output(socket->pcb.tcp);
        if (err != ERR_OK) {
            break;
        }
        MICROPY_PY_LWIP_EXIT
        mp_hal_delay_ms(50);
        MICROPY_PY_LWIP_REENTER
    }

    // Use nagle algorithm to determine when to send segment buffer (can be
    // disabled with TCP_NODELAY socket option)
    if (err == ERR_OK) {
        err = tcp_output_nagle(socket->pcb.tcp);
    }

    MICROPY_PY_LWIP_EXIT

    if (err != ERR_OK) {
        *_errno = error_lookup_table[-err];
        return MP_STREAM_ERROR;
    }

    return write_len;
}
