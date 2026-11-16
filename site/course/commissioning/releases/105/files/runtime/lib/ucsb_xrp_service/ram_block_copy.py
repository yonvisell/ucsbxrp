"""Internal RP2 block copy without temporary allocation.

The caller checks bounds and supplies a disjoint, writable byte destination.
"""

import micropython


@micropython.viper
def copy_into(source, address: int, destination):
    source_ptr = ptr8(source)
    destination_ptr = ptr8(destination)
    count = int(len(destination))
    for index in range(count):
        destination_ptr[index] = source_ptr[address + index]
