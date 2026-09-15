# Archer AX21 course network

Use this procedure when ready to configure the router. The Mac can remain on hotel Wi-Fi throughout the phone-based preparation. Leave the XRP disconnected until the final commissioning step.

## Equipment and intended arrangement

The confirmed model is **Archer AX21 (US), hardware V5.46**. Use its supplied power adapter. A USB-C to Gigabit Ethernet adapter with current macOS support and one Cat5e or Cat6 cable will make later Mac-based setup and camera work easier. No special 2.5 Gb/s adapter or managed switch is required for this setup.

The Archer will provide a private course network with its own DHCP server. DHCP assigns each device a local IP address. Leave the Internet/WAN port empty for the initial setup. The router's **No Internet Connection** indication is expected; computers and robots can still communicate locally. Use **Wireless Router mode** under **Advanced → System → Operation Mode**, retaining DHCP. Access Point mode is intended to extend an existing wired network and is unnecessary for this independent LAN. [TP-Link AX21 manual](https://static.tp-link.com/upload/manual/2021/202112/20211210/Archer%20AX21_User%20Guide.pdf)

Proposed course settings below are choices for this installation, not factory defaults:

| Setting | Value |
| --- | --- |
| Router LAN address | `192.168.50.1` |
| Subnet mask | `255.255.255.0` |
| DHCP pool | `192.168.50.100` through `192.168.50.199` |
| 2.4 GHz network | `UCSBXRP-Lab` |
| 5 GHz network | `UCSBXRP-Lab-5G` |
| XRP reserved address, assigned later | `192.168.50.110` |
| Future camera computer reservation | `192.168.50.120` |

Before using both Mac interfaces simultaneously, confirm that the hotel or other upstream network does not already use `192.168.50.x` with this mask. If it does, select a different private /24 network consistently throughout these instructions. Avoid the XRP's own hotspot subnet.

## 1. Prepare using a phone

1. Keep the Mac on its current Wi-Fi. On the phone, open Wi-Fi settings and join the router's **2.4 GHz SSID printed on its label**. Enter the wireless password printed on that label. Keep the router label and new passwords private; do not put them in a project file.
2. Accept remaining connected when the phone reports that this network has no internet. Open a browser and type `http://192.168.0.1` in the address bar. If the router uses another address, open the phone's Wi-Fi network details and use its Router/Gateway address. `http://tplinkwifi.net` is the documented hostname, but the numeric address avoids DNS ambiguity. The router's internal administration page does not need internet. [TP-Link login instructions](https://www.tp-link.com/us/support/faq/87/)
3. Create the router's **administrator password** yourself and save it privately. This is distinct from the Wi-Fi password. Use local administration; a TP-Link cloud account is not needed for the course LAN. Dismiss optional cloud sign-in and client-identification offers.
4. If Quick Setup checks the unplugged WAN cable, use **Skip** or the option to continue without internet when offered. If the firmware does not offer that option, leave Quick Setup and open **Advanced**. Do not enter hotel credentials into the router or attempt to repeat the hotel's wireless network.
5. Open **Advanced → Network → LAN**. Set the LAN address and subnet mask from the table and save. This changes the administration address and may disconnect the phone briefly. Rejoin the router Wi-Fi and open `http://192.168.50.1`.
6. Open **Advanced → Network → DHCP Server**. Leave DHCP enabled and set the address pool from the table. Retain the router itself as the local gateway. Save. This LAN will work without an internet DNS service.

## 2. Configure the course Wi-Fi

1. Open **Advanced → Wireless → Wireless Settings** (or the top-level **Wireless** page). Turn **Smart Connect off** so the two bands have separate names. Set the two SSIDs from the table. Smart Connect normally shares settings across the bands; separate names make robot selection explicit. [TP-Link Smart Connect](https://www.tp-link.com/us/support/faq/2595/)
2. Keep both radios enabled. For 2.4 GHz, use **WPA2-Personal / WPA2-PSK with AES**, a new privately recorded Wi-Fi password, and a mode that permits 802.11n clients. Do not choose WPA3-only or enterprise authentication for the XRP. Start with 20 MHz channel width and Auto channel; choose 1, 6 or 11 later if measured classroom interference warrants it. The controller's wireless hardware is single-band 2.4 GHz. [Raspberry Pi wireless hardware](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html)
3. Use the ordinary network, not Guest Network. Leave client/AP isolation disabled for this course LAN, and do not enable access-control rules that prevent laptop-to-XRP communication. No port forwarding, DMZ, cloud access or inbound internet service is needed.
4. Save and reconnect the phone to `UCSBXRP-Lab` with the new Wi-Fi password. Reopen `http://192.168.50.1`. Confirm the wireless names, DHCP settings and local access. An empty internet status remains expected.
5. Store the settings and passwords privately. At this point router preparation can stop; the Mac and XRP need not be connected yet.

## 3. Firmware, when the wired connection is available

Check **Advanced → System → Firmware Update** for installed firmware. Download only from the [official US V5.46 page](https://www.tp-link.com/us/support/download/archer-ax21/v5.46/). On 2026-09-14 that page listed **1.1.2 Build 20250814**, published 2026-01-21, and warned that downgrading is unavailable. Recheck before use. Download and extract the matching ZIP while the Mac has internet; install its firmware file locally through the router page. Prefer Ethernet and keep router power uninterrupted. Do not install V3/V4/V5.60 or a different region's file based on a similar name.

## 4. Connect the Mac while retaining hotel Wi-Fi

1. Connect the USB-C Ethernet adapter to the Mac and a cable from it to an Archer **LAN** port, not Internet/WAN. Keep Mac Wi-Fi connected to the hotel.
2. In **System Settings → Network**, open the Ethernet adapter's service, then **Details → TCP/IP**. Use DHCP. It should receive `192.168.50.100–199` and mask `255.255.255.0`. [Apple Ethernet settings](https://support.apple.com/en-ca/guide/mac-help/mh119392/mac)
3. In **Network → … → Set Service Order**, place **Wi-Fi above the Ethernet adapter** and apply. This favors hotel Wi-Fi for internet while the directly connected `192.168.50.0/24` network remains reachable over Ethernet. [Apple service order](https://support.apple.com/en-ie/guide/mac-help/mchlp2711/mac)
4. Open `http://192.168.50.1` and a normal internet page in separate tabs. Both must load before proceeding. If internet stops, unplug the Ethernet cable to restore the prior arrangement; then review the service order and subnet overlap. Do not alter the hotel connection to troubleshoot the router.
5. If no adapter is available, keep the Mac on hotel Wi-Fi until software is cached and this conversation can pause. Switching its Wi-Fi to the course SSID will remove its hotel internet connection. Save these instructions locally first. A phone can continue to administer the router independently.

## 5. Commission the XRP later

1. While internet is available, open UCSBXRP in Chrome and wait for **Ready without internet**. Keep that Chrome profile and site data. Select a Working folder and verify a virtual project runs and saves.
2. With the physical XRP available, use **Set up or repair** over USB-C. Choose **Existing Wi-Fi / station mode**, enter `UCSBXRP-Lab` and its password, and install the course runtime. This step is performed with the robot stopped; motor testing is separate.
3. Read the **XRP's own Wi-Fi MAC and assigned IP** from setup/router clients. The router label's MAC is the router's identity and must not be used as the XRP reservation.
4. In **Advanced → Network → DHCP Server → Address Reservation**, reserve `192.168.50.110` for that XRP MAC. Save, then reconnect/restart the XRP so it acquires the reservation. Use a unique reservation for each additional robot. Reserve `.120` later for the camera computer's actual network interface. [TP-Link address reservation](https://www.tp-link.com/us/support/faq/182/)
5. In UCSBXRP select **Physical XRP**, the existing-Wi-Fi route, and the XRP address reported after reconnection. Confirm identity and ready status. If Chrome requests local-network permission, allow it for the course site. Confirm zero-output communication, program output, Stop and Reset before any separately authorized motor check.
6. For the future camera computer, use an Archer LAN port when practical. Keep it and the XRP on this same local network; the camera plans require client communication and source timestamps. A working router alone does not qualify camera calibration or GNSS delivery.

## Completion checklist

- Phone reaches the router at its new address with the WAN cable absent.
- Both course SSIDs are visible and the 2.4 GHz network accepts the intended settings.
- After the adapter arrives, Mac reaches both the router and internet without switching Wi-Fi.
- After XRP commissioning, the reserved device address and robot identity agree in setup, router clients and UCSBXRP.
- Physical communications and motor tests remain explicitly recorded against their actual firmware and course release.

Menu names were checked against [TP-Link's public AX21 V5 emulator](https://emulator.tp-link.com/ArcherAX21v5/index.html); an installed firmware revision may arrange them differently. No physical router or XRP was configured during preparation of this document.
