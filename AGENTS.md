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

- Last verified firmware upload succeeded through `COM9`.
- Last verified live firmware build ID: `Aug  8 2026 20:55:49`
- Last verified build LED color: `#5FD391`
- Last verified UI build ID in `admin.html`: `ui-20260809-001`
- Live `/settings` verified firmware build identity and home WiFi connection were reporting correctly.
- Live `/admin.html` and `/admin.js` were uploaded and verified after the build identity change.

## Recent Feature PRs

- PR #1: Home WiFi/AP+STA/admin improvements, merged.
- PR #2: Standalone media upload queue, merged.
- PR #3: PC-side Plex-to-Nomad helper, merged.
- PR #4: Native Plex import prototype, merged.
- PR #5: Firmware and UI build identity indicators, open when this file was created.

## Pending Work Notes

- A Plex import queue feature was started on branch `feature/plex-import-queue`.
- Its in-progress changes were stashed with message `wip plex import queue`.
- Do not mix the Plex queue work into unrelated feature branches.
- The goal for the Plex queue is to let imports continue device-side after the browser tab closes and expose queue/progress status when returning to the page.

## Implementation Notes

- Admin web files are served from the SD card template and usually need both firmware compile/upload and SD file upload when endpoints and UI change together.
- Theme-aware pages use `theme-boot.js`, `theme-manager.js`, and the global `ThemeManager` symbol, not `window.ThemeManager`.
- Avoid storing generated Arduino build directories in git.
- Prefer `rg` for searches and keep edits narrowly scoped.
