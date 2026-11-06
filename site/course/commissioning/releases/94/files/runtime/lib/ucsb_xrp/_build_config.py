"""Build-time diagnostics for trusted course values and component operations.

Release builds omit recurring generic validation. A developer debug build sets
this constant to True before packaging; configuration and external admission
remain checked in either build, as does the final motor safety boundary.
"""

DEBUG_VALIDATION = False
