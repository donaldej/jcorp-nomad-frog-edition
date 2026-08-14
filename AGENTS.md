# Jcorp Nomad Project Context

This file is a handoff note for future coding sessions. Keep it current when firmware, upload flow, or repo workflow changes.

## Repo Workflow

- Primary fork: `donaldej/jcorp-nomad-frog-edition`
- Do not open PRs against the original upstream repo unless explicitly requested.
- Use one branch and one PR per new feature.
- Bug fixes for an active feature can update that feature branch.
- Local fork clone used for PR work: `C:\Users\Madz\Projects\jcorp-nomad\frog-edition-pr`
- Main working/upload folder with `arduino-cli.exe`: `C:\Users\Madz\Projects\jcorp-nomad`
- GitHub CLI path: `C:\Users\Madz\Projects\jcorp-nomad\tools\gh\bin\gh.exe`

## Hardware

- Device: Waveshare ESP32-S3 Touch LCD 4.3 style board used by Jcorp Nomad.
- Correct Arduino board profile:
  `esp32:esp32:esp32s3:USBMode=default,CDCOnBoot=cdc,MSCOnBoot=default,DFUOnBoot=default,UploadMode=default,CPUFreq=240,FlashMode=qio,FlashSize=16M,PartitionScheme=app3M_fat9M_16MB,DebugLevel=none,PSRAM=opi,LoopCore=1,EventsCore=1,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default`
- Normal USB serial port has usually appeared as `COM8`.
- Bootloader/upload port has appeared as `COM7` or `COM9`.
- If upload to the normal port fails with `No serial data received`, use the admin `Flash Mode` button or POST `/flash-mode`, then upload to the new bootloader COM port.

## Network Access

- Nomad AP default SSID: `Jcorp_Nomad`
- Nomad AP default password: `password`
- AP address: `http://192.168.4.1`
- mDNS address: `http://nomad.local`
- Current home WiFi integration keeps AP enabled while also connecting to home WiFi in STA mode.
- Local network commands often need escalated execution because sandboxed network access can fail.

## Build And Upload

Use the warmed main workspace build path when possible. Fresh Arduino build directories can take a long time or hang during library detection.

Compile from `C:\Users\Madz\Projects\jcorp-nomad`:

```powershell
.\arduino-cli.exe compile --fqbn "<FQBN above>" --jobs 1 --build-path .arduino-build-plex16 --build-cache-path .arduino-cache-plex16 firmware\JcorpNomadProject
```

Upload from `C:\Users\Madz\Projects\jcorp-nomad` after the board is in bootloader mode:

```powershell
.\arduino-cli.exe upload -p COM9 --fqbn "<FQBN above>" --input-dir .arduino-build-plex16 firmware\JcorpNomadProject
```

Update SD-hosted web files through the device web API:

```powershell
$content = Get-Content -LiteralPath 'SD_Card_Template\admin.html' -Raw
Invoke-WebRequest -Uri 'http://nomad.local/save' -Method Post -Body @{ filename='/admin.html'; content=$content } -UseBasicParsing -TimeoutSec 60
```

Repeat with the appropriate filename/content for other SD files.

## Current Device State

- Last verified firmware upload succeeded through the authenticated OTA endpoint.
- Last verified live firmware build ID: `Aug 14 2026 10:42:41`
- Last verified build LED color: `#44CB73`
- The device was reachable at `192.168.18.65` on home WiFi with the AP still enabled.
- OTA validation completed on `app0`; `/menu` returned HTTP 200 with no critical heap events.
- The RAM-only diagnostic endpoint was live at `/api/debug/throughput/ram`.
- The live candidate uses an 11,488-byte (8 MSS) streaming TCP send target and an 8 KiB AsyncTCP task stack.

## Recent Feature PRs

- PR #1: Home WiFi/AP+STA/admin improvements, merged.
- PR #2: Standalone media upload queue, merged.
- PR #3: PC-side Plex-to-Nomad helper, merged.
- PR #4: Native Plex import prototype, merged.
- PR #5: Firmware and UI build identity indicators, open when this file was created.
- PR #29: 4-bit high-speed SDMMC with safe fallback, merged.
- PR #30: Separate bounded auxiliary media response path, merged.
- PR #31: Bounded open-ended browser media ranges, merged.
- PR #32: RAM-only throughput diagnostics, merged.
- PR #33: Bounded streaming TCP send-window and AsyncTCP stack tuning, open when this file was updated.

## Performance Notes

- The persistent Plex import queue is merged and continues device-side after the browser tab closes.
- A PSRAM media read-ahead experiment was rejected because all tested variants reduced throughput; no PR was created.
- Pre-tuning matched home-network tests measured median throughput of 940,596 B/s from RAM and 866,311 B/s from SD-backed `/media`.
- Expanding accepted streaming connections from the core's 5,744-byte send capacity to 11,488 bytes measured 1,323,971 B/s from RAM and 1,185,682 B/s from media: gains of 40.8% and 36.9%.
- AsyncTCP's documented 16 KiB default stack left substantial unused capacity. `firmware/JcorpNomadProject/build_opt.h` sets it to 8 KiB; a concurrent stream/UI stress test retained 4,448 bytes of stack headroom and 13,580 bytes minimum internal heap with zero low/critical events.
- Tune media TCP capacity only after a request secures the primary stream slot. The RAM benchmark returns 409 during playback so rejected/diagnostic connections cannot allocate competing enlarged windows.
- Direct AP testing was much slower despite a 72 Mbps reported link: median 1 MiB RAM and media rates were 86,842 B/s and 111,538 B/s. Home WiFi through the router should be preferred for Plex imports and large transfers; AP+STA shares one ESP32 radio.
- The small RAM-versus-SD gap indicates that WiFi/TCP/AsyncWebServer is the primary throughput ceiling; avoid further SD buffering work without new evidence.

## Implementation Notes

- Admin web files are served from the SD card template and usually need both firmware compile/upload and SD file upload when endpoints and UI change together.
- Theme-aware pages use `theme-boot.js`, `theme-manager.js`, and the global `ThemeManager` symbol, not `window.ThemeManager`.
- Avoid storing generated Arduino build directories in git.
- Changing `build_opt.h` invalidates the entire Arduino/ESP32 dependency cache and took about 23 minutes with `--jobs 1`; unchanged incremental builds returned to about 40 seconds.
- Prefer `rg` for searches and keep edits narrowly scoped.
