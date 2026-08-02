"""Small, MicroPython-compatible validation for the target protocol."""

PROTOCOL_VERSION = 1
SERVICE_VERSION = "2026.08-dev.4"
MAX_PROJECT_FILES = 48
MAX_PROJECT_BYTES = 256 * 1024
MAX_FILE_BYTES = 96 * 1024
_SAFE_NAME_CHARACTERS = (
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
)
_SAFE_PATH_CHARACTERS = _SAFE_NAME_CHARACTERS + "/"


class ProtocolError(ValueError):
    def __init__(self, code, detail):
        super().__init__(detail)
        self.code = code
        self.detail = detail


class LineLogWriter:
    """Turn Python stream writes into complete line events."""

    def __init__(self, stream, emit):
        self.stream = stream
        self._emit = emit
        self._buffer = ""

    def write(self, value):
        text = str(value)
        self._buffer += text
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            self._emit(self.stream, line)
        return len(text)

    def flush(self):
        if self._buffer:
            self._emit(self.stream, self._buffer)
            self._buffer = ""

    def print(self, *values, **options):
        """A MicroPython-compatible print function for project globals."""
        separator = options.pop("sep", " ")
        ending = options.pop("end", "\n")
        if options:
            raise TypeError("unsupported print option: " + next(iter(options)))
        if not isinstance(separator, str) or not isinstance(ending, str):
            raise TypeError("print sep and end must be strings")
        self.write(separator.join(str(value) for value in values) + ending)


def validate_request_id(value):
    if not isinstance(value, str) or not value or len(value) > 80:
        raise ProtocolError("invalid_request", "requestId must be 1 to 80 characters")
    for character in value:
        if character not in _SAFE_NAME_CHARACTERS:
            raise ProtocolError(
                "invalid_request",
                "requestId contains an unsupported character",
            )
    return value


def normalize_project_path(value):
    if not isinstance(value, str):
        raise ProtocolError("invalid_project", "project paths must be strings")
    path = value.replace("\\", "/").strip("/")
    parts = path.split("/")
    if not path or len(path) > 160 or any(part in ("", ".", "..") for part in parts):
        raise ProtocolError("invalid_project", "invalid project path: {!r}".format(value))
    for character in path:
        if character not in _SAFE_PATH_CHARACTERS:
            raise ProtocolError(
                "invalid_project",
                "unsupported character in project path: {!r}".format(value),
            )
    return path


def validate_project(value):
    if not isinstance(value, dict):
        raise ProtocolError("invalid_project", "project must be an object")
    files = value.get("files")
    if not isinstance(files, dict) or not files:
        raise ProtocolError("invalid_project", "project.files must not be empty")
    if len(files) > MAX_PROJECT_FILES:
        raise ProtocolError(
            "project_too_large",
            "project contains more than {} files".format(MAX_PROJECT_FILES),
        )

    normalized_files = {}
    total_bytes = 0
    for raw_path, content in files.items():
        path = normalize_project_path(raw_path)
        if path in normalized_files:
            raise ProtocolError("invalid_project", "duplicate project path: " + path)
        if not isinstance(content, str):
            raise ProtocolError("invalid_project", path + " must contain text")
        byte_count = len(content.encode("utf-8"))
        if byte_count > MAX_FILE_BYTES:
            raise ProtocolError("project_too_large", path + " is too large")
        total_bytes += byte_count
        if total_bytes > MAX_PROJECT_BYTES:
            raise ProtocolError("project_too_large", "project text is too large")
        normalized_files[path] = content

    entrypoint = normalize_project_path(value.get("entrypoint"))
    if entrypoint not in normalized_files:
        raise ProtocolError("invalid_project", "entrypoint is not in project.files")
    if not entrypoint.endswith(".py"):
        raise ProtocolError("invalid_project", "entrypoint must be a Python file")

    name = value.get("name", "XRP project")
    if not isinstance(name, str) or not name.strip():
        raise ProtocolError("invalid_project", "project.name must be nonempty text")
    return {
        "name": name.strip()[:80],
        "entrypoint": entrypoint,
        "files": normalized_files,
        "bytes": total_bytes,
    }


def project_revision(project):
    """Return the browser-compatible identity of validated project text."""
    try:
        import hashlib
    except ImportError:
        import uhashlib as hashlib

    digest = hashlib.sha256()

    def update_part(value):
        body = value.encode("utf-8")
        digest.update(str(len(body)).encode("ascii"))
        digest.update(b":")
        digest.update(body)
        digest.update(b";")

    update_part(project["entrypoint"])
    for path in sorted(project["files"]):
        update_part(path)
        update_part(project["files"][path])
    return "".join("{:02x}".format(value) for value in digest.digest())


def reply(request_id, ok=True, result=None, error=None):
    value = {"protocol": PROTOCOL_VERSION, "requestId": request_id, "ok": bool(ok)}
    if ok:
        value["result"] = {} if result is None else result
    else:
        value["error"] = error or {
            "code": "internal_error",
            "detail": "Unknown target error",
        }
    return value
