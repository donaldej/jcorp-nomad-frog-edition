# <div align="center">Jcorp Nomad</div>

<div align="center">
  <img src="NomadCoverMK4v2.png" alt="Jcorp Nomad Offline Media Server" width="800">
</div>

<p align="center"><b>A portable, offline media server powered by the ESP32-S3 in a thumbdrive form factor.</b><br>
Stream movies, music, books, and shows anywhere - no internet required.</p>

<p align="center">
  <img src="https://img.shields.io/badge/release-Mk4-red.svg" alt="Release: Mk4" />
  <img src="https://img.shields.io/badge/license-CC--BY--NC--SA%204.0-blue.svg" alt="License: CC BY-NC-SA 4.0" />
  <img src="https://img.shields.io/badge/platform-ESP32--S3-orange" alt="Platform: ESP32-S3" />
  <img src="https://img.shields.io/badge/status-beta-yellow" alt="Status: Beta" />
</p>

<p align="center">
  <a href="https://nomad.jcorptech.net"><b>Buy a Prebuilt Nomad</b></a> &nbsp;|&nbsp;
  <a href="https://ko-fi.com/jcorptech"><b>Support on Ko-fi</b></a>
</p>

---

> **Mk4 Release** - A big one. Full offline Wikipedia support, a redesigned case, and a long list of stability fixes under the hood. This update touches both firmware and frontend, so a reflash is required coming from Mk3. Still semi-stable while I iron out edge cases, but everything core is working well.

---

## What is Nomad

Jcorp Nomad is an open-source offline media server designed for travel, remote work, classrooms, camping, and more. It runs entirely on an ESP32-S3, creates a local Wi-Fi hotspot, and serves media through a browser interface. Multiple users can browse the interface at the same time, all without internet access.

For stability on the ESP32-S3, the current firmware permits one active media HTTP request at a time. Starting playback on a second device while another stream is active can interrupt or temporarily reject the first stream. Concurrent independent video playback is not currently supported.

This project is compact, easy to modify, and includes optional 3D-printable hardware. Both firmware and web interface are fully open-source.

---

## Get a Nomad

### Build It Yourself (Recommended)

I strongly recommend building your own Nomad. It's not a very difficult project, if you can follow instructions and plug in a USB cable, you can do it. The parts are cheap, widely available, and the whole build takes under an hour. See Hardware Requirements and Quick Start below. If nothing else please check out the DIY option before purchasing. 

### Buy a Prebuilt

That said, I also won't say no to money. If you'd rather skip the DIY and get a ready-to-go unit, prebuilt Nomads are available at **[nomad.jcorptech.net](https://nomad.jcorptech.net)**.

Every Nomad, whether you build it or buy it, runs the same open-source firmware and web interface. When new features and updates are released, you can always flash the latest code yourself to stay up to date. This project isn't going anywhere. 

### Support Development

If you just want to support the project, donations are always appreciated:  
**[ko-fi.com/jcorptech](https://ko-fi.com/jcorptech)**

---

## Mk4 Highlights

### Offline Wikipedia & Archive Support (ZIM)
- Browse and search full offline Wikipedia (and other ZIM archives like Gutenberg and TED) directly from the SD card
- Search is fast even on massive archives, the companion [Nomad Tools](https://github.com/Jstudner/Nomad-Tools) app prebuilds a compact index on your PC, so the device never has to search the raw multi-gigabyte file itself
- Embedded videos and epub books inside archives play/read right in the browser
- Works with zero extra UI cost if you don't use it, no archives on the card means the feature stays completely out of the way
- Currently tested with Gutenburg epubs, TedX Videos, and wikipedia from the tiny 0.8 file all the way to the 140gb maxi with images. 

### Redesigned Case
<p align="center">
  <img src="NomadMk4Explode.png" alt="Nomad Mk4 exploded case view" width="700">
</p>

- New case slides together **front-to-back** instead of the old top-to-bottom design
- No more direct pressure on the screen, which was a common cause of cracked/broken screens on the old case
- Buttons stay exposed on the outside, so you can still flash firmware or hit the boot button without disassembling anything

- Based on a remix of [ESP32 C6 with LCD Screen Enclosure Case](https://makerworld.com/en/models/2121443-esp32-c6-with-lcd-screen-enclosure-case) on MakerWorld by [**Adrian**](https://makerworld.com/en/@user_1765744671), full credit to the original design this was based off of.

### Indexing & Stability
- Root-caused and fixed a long-standing random reboot bug tied to files over 2GB, this was the actual cause of crashes on image-heavy Wikipedia pages and big movie scrubbing
- Fixed a heap-corruption crash that could hit when indexing and refreshing SD totals at the same time
- Boot-time indexing now only re-scans when files have actually changed, instead of a full scan on every boot
- Removed the screens loading spinner that was silently forcing a full-screen redraw every loop, pulling it out made the whole device noticeably more stable

### Reader & Memory Improvements
- Comic and PDF readers now free old pages from memory as you scroll, fixing crashes on long comics and scanned PDFs
- PDF viewer shows a real loading percentage instead of a blank screen
- Cleaned out a bunch of dead code and unused libraries that were loading on every Books page

### UI & Admin Updates
- Unified header and button styling across pages so themes apply consistently everywhere
- Fixed several dark mode readability bugs (unreadable resume text, buttons that ignored custom themes, etc.)
- Admin panel settings are now gated behind a login
- Fixed a stuck brightness slider caused by an out-of-range default value

### Frog Edition Additions

- **AP + Home Wi-Fi:** Nomad keeps its offline access point available while optionally joining a configured home network, making large uploads and Plex access easier at home.
- **Standalone Upload Manager:** The Uploads page provides multi-file selection, queue order, per-file progress, retry/cancel controls, and targeted library reindexing after uploads.
- **Native Plex Import:** Configure a Plex server URL and token, browse movie and TV libraries, choose an import destination, and queue media without finding the source file manually.
- **Persistent Plex Queue:** Device-side Plex imports are persisted and resumable. Imports continue after the browser tab closes, and queue state, progress, retry, cancel, and history are available when the page is reopened.
- **Browser-Compatible Plex Media:** Plex imports can request H.264/AAC-compatible output for direct browser playback when source audio or container support would otherwise be a problem.
- **Automatic Plex Sync:** Sync a Plex playlist or collection on a schedule, enforce a minimum free-space threshold, and optionally prune only files managed by that sync configuration.
- **Bulk Transfer Mode:** Temporarily reduce nonessential background work during large Plex transfers to reserve memory and SD bandwidth for the import pipeline.
- **Device Health & Diagnostics:** The Admin page reports heap, PSRAM, Wi-Fi, SD-card activity, watchdog state, active work, uptime, and persistent information about the previous restart.
- **Admin OTA Updates:** Upload a compiled firmware image from the Admin page with partition validation and rollback protection if the new image cannot boot cleanly.
- **Build Identity:** Firmware and Admin UI build identifiers make it clear which version is running. Firmware builds also select a different LED color as a visible update indicator.
- **Media Stability:** Large-index loading, movie-page memory use, HTTP byte-range handling, and SD access have been hardened to reduce freezes and reboots.
- **Faster SD Access:** Supported boards negotiate 4-bit high-speed SDMMC at boot, with automatic default-speed and 1-bit compatibility fallbacks.
- **Responsive Artwork During Playback:** Posters, subtitles, and small sidecar metadata use a bounded PSRAM-backed response path so library UI requests do not consume the primary media-stream slot.
- **Bounded Browser Ranges:** Open-ended audio and video requests are served in 16 MiB segments, reducing long-lived response state while preserving explicit ranges, suffix ranges, and seeking.

### Default Themes (28)

Default Blue, Forest Night, Cherry Blossom, Mocha Latte, Ocean Depths,
Autumn Leaves, Lavender Fields, Sunset Horizon, Coral Reef, Mountain Mist,
Jade Garden, Desert Sand, Arctic Aurora, DeLorean, Midnight Code, 90s Retro,
Mint Breeze, Rose Gold, Crimson Night, Emerald Dream, Royal Purple,
Copper Sunset, Sapphire Sea, Peach Cream, Slate Storm, Lime Zest,
Burgundy Wine, Teal Oasis

---

## Features

- **Offline Encyclopedia:** ZIM archive support for offline Wikipedia and other offline wikis, with fast on-device search.
- **Admin Panel:** Full device controls, library indexing, Theme Customizer, login-gated settings.
- **Home Network Mode:** Optional home Wi-Fi connection while the offline Nomad access point remains available.
- **File Browser:** Upload, rename, delete, download, and inline file editing. (Recommended to use a PC)
- **Upload Manager:** Standalone multi-file queue with progress, retry/cancel controls, and post-upload reindexing.
- **Plex Import & Sync:** Persistent device-side imports, browser-compatible conversion, playlists/collections, scheduled sync, and managed-file pruning.
- **Device Health:** Live resource metrics, watchdog state, previous-restart diagnostics, and firmware/UI build identity.
- **OTA Firmware Updates:** Admin-page firmware installation with boot validation and rollback safeguards.
- **Global Search:** Quickly find media across all categories from the Menu page.
- **Music Player:** Seamless background playback with subdirectory playlists and a dynamic Queue.
- **Movies & Shows:** Plyr-integrated playback with season/special folder support.
- **Digital Library:** EPUB support, PDF handling, and a dedicated Comic/Webtoon reader.
- **Resume Tracking:** Saves playback progress for Movies, Shows, and certain Books.
- **Gallery & Files:** Dedicated pages for image viewing, video clips, and general file sharing.
- **Captive Portal:** Automatic login/redirection for easy access.
- **Persistent Settings:** Themes and system configurations saved across reboots.
- **Mobile-Friendly UI:** Fully responsive design optimized for handheld offline streaming.

---

## Hardware Compatibility

Nomad is built specifically for the **Waveshare ESP32-S3 Dev Board (1.47" LCD version)**. Due to the number of low-level tricks used to squeeze this much functionality out of the hardware, it is difficult to get Nomad running on other boards.

There are a few community forks that target other ESP32 boards, but your mileage will vary. I'm also actively working on a **Nomad Lite** version with wider board compatibility, focused on basic streaming without all the advanced features.

---

## Hardware Requirements

- **Waveshare ESP32-S3 Dev Board (1.47" LCD version)**
  [Amazon Link](https://amzn.to/4ktB6oT)

- **FAT32 microSD card (16-128GB recommended, up to 2TB)**
  [Amazon Link](https://amzn.to/44tM1c4)

- **SD-Card Extender (optional, 3DP case compatible)**
  [Amazon Link](https://amzn.to/45IWIJz)

- **USB power source**
- **Optional:** 3D-printed enclosure (STL files included)

---

## Software Requirements

- Arduino IDE
- Arduino Librarys, EXACT VERSIONS:
"ArduinoJson" by Benoit Blanchon v7.3.0,
"Async TCP" by ESP32Async v3.4.7,
"ESP Async Webserver" by ESP32Async v3.7.1,
"LVGL" by kisvegabor v8.3.10,
"SDFat" by Bill Greiman v2.3.0,
- Fat32Format or equivalent
- **Optional:** [HandBrake 1.11.2 preset](tools/handbrake/) for small,
  browser-friendly 480p MP4 files
- **Optional:** [Plex to Nomad helper](tools/plex-to-nomad.ps1) for copying
  selected Movies and Shows from a Plex server to Nomad over Wi-Fi.
- SquareLine Studio (optional, for UI editing)

---

## Quick Start

1. Flash ESP32-S3 firmware from `/firmware/`.
2. Format SD card as FAT32 and copy `/SD_Card_Template/` files.
3. Place media in `/Movies`, `/Shows`, `/Books`, `/Music`, `/Gallery`, `/Files`.
4. Insert SD card and power device via USB.
5. Connect to Wi-Fi `Jcorp_Nomad` with password: `password`.
6. Open the browser interface.
7. Click the gear icon → Library Index → **Full Scan Now**.
8. Monitor Admin Console for progress; scan may take minutes.
9. Return to Menu page and enjoy your media!

---

## On-Device Plex Import

Open **Plex Import** from the Menu or Admin page to configure the Plex server URL
and token. Nomad can browse Plex movie and show libraries, load episodes, and
import a selected item directly to an SD-card destination.

The on-device queue is persistent and resumable. Once an item is queued, the
browser tab may be closed; Nomad continues the transfer and exposes its current
status when the Plex Import page is opened again. Queue entries can be cancelled,
retried, or removed from history.

Enable **Web Compatible** when the Plex source is not already suitable for direct
browser playback. Plex will provide a compatible stream, including AAC audio when
needed. **Bulk Transfer Mode** pauses nonessential background work during large
imports. Automatic sync can periodically mirror a Plex playlist or collection,
subject to the configured free-space limit.

The Plex server URL is configurable and is not hard-coded. Nomad must be connected
to a network that can reach the Plex server; the offline access point remains
available while home Wi-Fi is enabled.

---

## Plex to Nomad Helper

Windows users can run `tools/plex-to-nomad.ps1` to copy selected movies or TV
episodes from a Plex server to Nomad without manually hunting for files.

```powershell
.\tools\plex-to-nomad.ps1
```

The helper:

- Reads Plex movie/show libraries using the Plex API.
- Lets you pick movies or episodes from a numbered console list.
- Creates matching folders on Nomad.
- Uploads through Nomad's `/upload` endpoint with `curl.exe` progress.
- Requests a Nomad reindex after uploads finish.

This PowerShell helper is PC-driven, so the PC and script must remain running until
the upload finishes. Use the on-device Plex Import queue when the transfer should
continue independently of the browser or PC.

If the Plex server's original file paths are not accessible from this PC, run:

```powershell
.\tools\plex-to-nomad.ps1 -DownloadIfMissing
```

That mode downloads a temporary copy from Plex first, uploads it to Nomad, then
removes the temporary file.

---

## Key Improvements

1. **Faster & More Reliable Indexing**
   - Non-blocking, background indexing for large libraries.
   - Safe on power loss; partial indexes remain intact.
   - Auto-updates changes; frontend detects updates automatically.
   - Boot-time indexing now only triggers on an actual file change, not every boot.

2. **Resume Functionality**
   - Movies and Shows track playback progress.
   - Options for **Play from Start** or **Resume**.
   - Menu displays last three movies/shows; mobile shows most recent.

3. **Dark Mode**
   - Toggleable across all pages from the menu.
   - Consistent theme tokens across pages, no more mismatched dark colors.

4. **Admin Page**
   - Full device control: shutdown, restart, flash mode, AP and home Wi-Fi, RGB LEDs, brightness, credentials, indexing, and file management.
   - Login-gated settings so changes require the admin password.
   - Safe shutdown option for SD card health.
   - Real-time system console feedback.
   - Device health metrics, persistent restart diagnostics, firmware/UI build identifiers, and OTA firmware updates with rollback protection.

5. **Stability Improvements**
   - Fixed frontend NDJSON sync issues.
   - Crash recovery on large indexes.
   - Fixed a random-reboot bug tied to files over 2GB.
   - Dynamic LCD brightness adjustment.
   - Correct HTTP byte-range responses for reliable seeking and browser playback.
   - Memory-safe movie index loading and PSRAM-backed background task stacks.
   - 4-bit high-speed SDMMC mounting with safe fallbacks and live bus diagnostics.
   - A separate bounded auxiliary response path keeps artwork and metadata available during playback.
   - Open-ended browser media ranges are capped without changing explicit seek ranges.
   - A single active media-request limit prevents the concurrent-stream freezes seen on this hardware.

6. **Improved Library Support**
   - Supports deeper folder structures for Shows and Music.
   - Flexible organization; media files can be nested at any level.

7. **Persistent Transfer Workflows**
   - Device-side Plex queue survives page navigation and browser closure.
   - Resumable buffered imports expose progress, retry, cancellation, and history.
   - Scheduled playlist/collection sync supports free-space limits and managed-file pruning.

---

```
Folder Structure

/Movies
    Interstellar.mp4
    Interstellar.jpg

/Shows
    /The Office
        S01E01 - Pilot.mp4
        S01E02 - Diversity Day.mp4
    The Office.jpg

    /Gravity Falls
        /Season 1
            S1E1 - Tourist Trapped.mp4
            S1E2 - The Legend of the Gobblewonker.mp4
        /Season 2
            S2E1 - Scary-oke.mp4
            S2E2 - Into the Bunker.mp4
        Alex Hirsch Interview.mp4
    Gravity Falls.jpg

/Books
    The Martian.pdf
    The Martian.jpg
    /How to Train Your Dragon
        book1.pdf
        book2.mp3
        book1.jpg
        book2.jpg
    How to Train Your Dragon.jpg

/Music
    track01.mp3
    /Artist1
        track01.mp3
        /Album1
            track02.mp3
    /PersonName
        /Playlist1
            track01.mp3
        /Playlist2
            track02.mp3

/Gallery
    image01.jpg
    video01.mp4

/Files
    document.pdf
    example.txt

index.html
appleindex.html
menu.html
movies.html
shows.html
books.html
music.html
gallery.html
files.html
archive.html
Logo.png
favicon.ico
```

---

## Supported Formats

- **Video:** `.mp4, .webm, .m4v, .mov, .mkv, .ts, .m2ts` 
- **Audio:** `.mp3, .flac, .wav, .ogg, .aac, .m4a`
- **Books:** `.pdf, .epub, .cbz, .cbr` 
- **Images:** `.jpg, .jpeg, .png` 
- **Archives:** `.zim` (offline Wikipedia and other ZIM-format wikis), needs special processing, you cant just drop a .zim in sadly. Prep them with [Nomad Tools](https://github.com/Jstudner/Nomad-Tools) first (still rough, but handles most common ZIMs)

---


## 3D Printed Case Files

The Mk4 default case is a remix of [ESP32 C6 with LCD Screen Enclosure Case](https://makerworld.com/en/models/2121443-esp32-c6-with-lcd-screen-enclosure-case) on MakerWorld, credit to [**Adrian**](https://makerworld.com/en/@user_1765744671) for the original design. It's a front-to-back slide design that keeps pressure off the screen while still exposing the buttons for firmware access.

- Mk4 case files: in this repo
- Original Mk3 top/bottom case (still works, just more prone to screen pressure): [Thingiverse](https://www.thingiverse.com/thing:7223398)

---

## What's Next

**Nomad Lite** - A stripped-down version of Nomad with wider board compatibility, focused on core streaming features. In active development now that Mk4 is out.

**Nomad Manager** - A companion application for Nomad that integrates with Jellyfin to handle automated media downcoding and transfers, and builds the offline archive indexes used by the ZIM reader. Keep your Nomad stocked and ready to go without manual file management.

**Gallion** - A larger-scale sibling to Nomad, built on more capable hardware. Gallion is designed to handle everything that couldn't fit on Nomad's current platform > ROM emulation, 4k video, and expanded media compatibility across the board. The current version is [here](https://github.com/Jstudner/Gallion).

---

## Project Inspiration

Inspired by my experience running a Jellyfin server, I wanted a portable, low-cost solution for offline media streaming. Challenges with SBCs (Raspberry Pi, etc.) included high power usage, heat, and instability.

Nomad focuses on delivering:

- Offline access
- Wide device compatibility
- Simple frontend for media browsing and playback
- Multiple user support
- High customization potential

The ESP32-S3 provides enough performance to handle these requirements efficiently, in a pocket-sized form factor.

---

## License

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) - free to remix and share for non-commercial use with attribution.

---

## Credits

Developed by **Jackson Studner (Jcorp Tech)**.
Inspired by open-source offline media projects. Contributions via PRs welcome.

<p align="center">
  <a href="https://ko-fi.com/jcorptech"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support on Ko-fi"></a>
</p>
