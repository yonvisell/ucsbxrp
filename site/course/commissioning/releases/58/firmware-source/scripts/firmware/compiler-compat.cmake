# Identical warning policy for the stock and GC-sync references.
# Keep GCC 15 array-bounds diagnostics visible; relax their fatal status only
# in the two pinned mbedTLS files which failed the original stock build.
if(NOT DEFINED MICROPY_DIR)
    message(FATAL_ERROR "The firmware hook requires MicroPython's MICROPY_DIR")
endif()
set_source_files_properties(
    "${MICROPY_DIR}/lib/mbedtls/library/aes.c"
    "${MICROPY_DIR}/lib/mbedtls/library/gcm.c"
    PROPERTIES COMPILE_OPTIONS "-Wno-error=array-bounds"
)
