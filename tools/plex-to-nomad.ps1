<# 
.SYNOPSIS
  Copy movies or TV episodes from a Plex server to Jcorp Nomad.

.DESCRIPTION
  This helper reads Plex library metadata, lets you choose movies or episodes,
  creates the matching folders on Nomad, uploads files through Nomad's /upload
  endpoint with curl.exe progress, and triggers a Nomad reindex afterward.

  It works best when this PC can access the original Plex media paths. If not,
  use -DownloadIfMissing to download a temporary copy from Plex before upload.

.EXAMPLE
  .\tools\plex-to-nomad.ps1

.EXAMPLE
  .\tools\plex-to-nomad.ps1 -PlexUrl http://192.168.18.21:32400 -NomadUrl http://nomad.local -DownloadIfMissing
#>

[CmdletBinding()]
param(
  [string]$PlexUrl = "http://127.0.0.1:32400",
  [string]$PlexToken = $env:PLEX_TOKEN,
  [string]$NomadUrl = "http://nomad.local",
  [string]$NomadAdminPassword,
  [switch]$DownloadIfMissing,
  [string]$TempDir = (Join-Path $env:TEMP "plex-to-nomad"),
  [int]$MaxResults = 50
)

$ErrorActionPreference = "Stop"

function Normalize-BaseUrl {
  param([string]$Url)
  return $Url.Trim().TrimEnd("/")
}

function ConvertTo-PlainText {
  param([securestring]$Secure)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Get-Sha256Hex {
  param([string]$Text)
  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    return (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join "")
  } finally {
    $sha.Dispose()
  }
}

function ConvertTo-SafeName {
  param([string]$Name)
  $safe = ($Name -replace '[<>:"/\\|?*\x00-\x1F]', " " -replace "\s+", " ").Trim(" .")
  if ([string]::IsNullOrWhiteSpace($safe)) { return "Untitled" }
  return $safe
}

function Join-NomadPath {
  param([string[]]$Parts)
  $clean = foreach ($part in $Parts) {
    if (![string]::IsNullOrWhiteSpace($part)) { $part.Trim("/") }
  }
  return "/" + ($clean -join "/")
}

function Get-PlexTokenFromPreferences {
  $prefsPath = Join-Path $env:LOCALAPPDATA "Plex\Plex Media Server\Preferences.xml"
  if (!(Test-Path -LiteralPath $prefsPath)) { return $null }
  try {
    [xml]$prefs = Get-Content -LiteralPath $prefsPath -Raw
    return [string]$prefs.Preferences.PlexOnlineToken
  } catch {
    return $null
  }
}

function Invoke-PlexXml {
  param([string]$PathAndQuery)
  $sep = if ($PathAndQuery.Contains("?")) { "&" } else { "?" }
  $url = "$PlexUrl$PathAndQuery$sep" + "X-Plex-Token=$([uri]::EscapeDataString($PlexToken))"
  $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60
  [xml]$xml = $res.Content
  return $xml
}

function Get-NodeValue {
  param($Node, [string]$Name)
  if ($null -eq $Node) { return $null }
  $value = $Node.$Name
  if ($value -is [System.Xml.XmlAttribute]) { return $value.Value }
  return [string]$value
}

function Select-NumberedItems {
  param(
    [array]$Items,
    [string]$Prompt = "Choose number(s), comma ranges like 1,3-5, or all"
  )
  if (!$Items -or $Items.Count -eq 0) { return @() }
  $answer = (Read-Host $Prompt).Trim()
  if ($answer -match '^(a|all)$') { return $Items }

  $indices = New-Object System.Collections.Generic.HashSet[int]
  foreach ($piece in ($answer -split ",")) {
    $piece = $piece.Trim()
    if ($piece -match '^(\d+)-(\d+)$') {
      $start = [int]$matches[1]
      $end = [int]$matches[2]
      for ($i = [Math]::Min($start, $end); $i -le [Math]::Max($start, $end); $i++) {
        [void]$indices.Add($i)
      }
    } elseif ($piece -match '^\d+$') {
      [void]$indices.Add([int]$piece)
    }
  }

  $selected = foreach ($idx in ($indices | Sort-Object)) {
    if ($idx -ge 1 -and $idx -le $Items.Count) { $Items[$idx - 1] }
  }
  return @($selected)
}

function Show-Choices {
  param([array]$Items, [scriptblock]$Label)
  for ($i = 0; $i -lt $Items.Count; $i++) {
    "{0,3}. {1}" -f ($i + 1), (& $Label $Items[$i]) | Write-Host
  }
}

function Get-NomadSessionToken {
  try {
    $settings = Invoke-RestMethod -Uri "$NomadUrl/settings" -UseBasicParsing -TimeoutSec 15
  } catch {
    throw "Could not reach Nomad at $NomadUrl. Connect to Nomad WiFi/LAN and try again. $($_.Exception.Message)"
  }

  if ($settings.adminPasswordSet -ne $true) { return $null }

  if ([string]::IsNullOrWhiteSpace($NomadAdminPassword)) {
    $secure = Read-Host "Nomad admin password" -AsSecureString
    $NomadAdminPassword = ConvertTo-PlainText $secure
  }

  $hash = Get-Sha256Hex $NomadAdminPassword
  $bodyJson = @{ hash = $hash } | ConvertTo-Json -Compress
  $login = Invoke-RestMethod -Uri "$NomadUrl/auth/login" `
    -Method Post `
    -Body @{ body = $bodyJson } `
    -ContentType "application/x-www-form-urlencoded" `
    -UseBasicParsing `
    -TimeoutSec 15

  return [string]$login.token
}

function Invoke-NomadPost {
  param([string]$Path, [hashtable]$Body, [string]$Token)
  $headers = @{}
  if (![string]::IsNullOrWhiteSpace($Token)) { $headers["X-Admin-Token"] = $Token }
  return Invoke-WebRequest -Uri "$NomadUrl$Path" `
    -Method Post `
    -Headers $headers `
    -Body $Body `
    -ContentType "application/x-www-form-urlencoded" `
    -UseBasicParsing `
    -TimeoutSec 30
}

function Ensure-NomadDirectory {
  param([string]$Dir, [string]$Token)
  $parts = @($Dir.Trim("/") -split "/" | Where-Object { $_ })
  $current = ""
  foreach ($part in $parts) {
    $current = "$current/$part"
    try {
      [void](Invoke-NomadPost -Path "/mkdir" -Body @{ dirname = $current } -Token $Token)
      Write-Host "Created $current"
    } catch {
      $response = $_.Exception.Response
      if ($response -and [int]$response.StatusCode -eq 409) {
        continue
      }
      throw
    }
  }
}

function Get-BestPlexPart {
  param($VideoNode)
  foreach ($media in @($VideoNode.Media)) {
    foreach ($part in @($media.Part)) {
      if ($part -and ((Get-NodeValue $part "file") -or (Get-NodeValue $part "key"))) {
        return $part
      }
    }
  }
  return $null
}

function New-MovieTransfer {
  param($VideoNode)
  $part = Get-BestPlexPart $VideoNode
  if (!$part) { return $null }
  $title = ConvertTo-SafeName (Get-NodeValue $VideoNode "title")
  $year = Get-NodeValue $VideoNode "year"
  $file = Get-NodeValue $part "file"
  $partKey = Get-NodeValue $part "key"
  $ext = [IO.Path]::GetExtension($file)
  if ([string]::IsNullOrWhiteSpace($ext)) { $ext = "." + (Get-NodeValue $VideoNode "container") }
  $folder = if ($year) { "$title ($year)" } else { $title }
  $remoteName = if ($year) { "$title ($year)$ext" } else { "$title$ext" }
  [pscustomobject]@{
    Kind = "Movie"
    Label = if ($year) { "$title ($year)" } else { $title }
    LocalPath = $file
    PartKey = $partKey
    NomadDir = Join-NomadPath @("Movies", $folder)
    RemoteName = ConvertTo-SafeName $remoteName
  }
}

function New-EpisodeTransfer {
  param($VideoNode)
  $part = Get-BestPlexPart $VideoNode
  if (!$part) { return $null }
  $show = ConvertTo-SafeName (Get-NodeValue $VideoNode "grandparentTitle")
  $title = ConvertTo-SafeName (Get-NodeValue $VideoNode "title")
  $season = [int](Get-NodeValue $VideoNode "parentIndex")
  $episode = [int](Get-NodeValue $VideoNode "index")
  $file = Get-NodeValue $part "file"
  $partKey = Get-NodeValue $part "key"
  $ext = [IO.Path]::GetExtension($file)
  if ([string]::IsNullOrWhiteSpace($ext)) { $ext = "." + (Get-NodeValue $VideoNode "container") }
  $seasonName = "Season {0:00}" -f $season
  $remoteName = "S{0:00}E{1:00} - {2}{3}" -f $season, $episode, $title, $ext
  [pscustomobject]@{
    Kind = "Episode"
    Label = "$show - $remoteName"
    LocalPath = $file
    PartKey = $partKey
    NomadDir = Join-NomadPath @("Shows", $show, $seasonName)
    RemoteName = ConvertTo-SafeName $remoteName
  }
}

function Resolve-TransferFile {
  param($Transfer)
  if ($Transfer.LocalPath -and (Test-Path -LiteralPath $Transfer.LocalPath)) {
    return @{ Path = $Transfer.LocalPath; Temporary = $false }
  }

  if (!$DownloadIfMissing) {
    $answer = Read-Host "Local path not found for '$($Transfer.Label)'. Download temporary copy from Plex? [y/N]"
    if ($answer -notmatch '^(y|yes)$') { return $null }
  }

  if ([string]::IsNullOrWhiteSpace($Transfer.PartKey)) {
    Write-Warning "Plex did not provide a downloadable part key for $($Transfer.Label). Skipping."
    return $null
  }

  New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
  $dest = Join-Path $TempDir $Transfer.RemoteName
  $downloadUrl = "$PlexUrl$($Transfer.PartKey)?download=1&X-Plex-Token=$([uri]::EscapeDataString($PlexToken))"
  Write-Host "Downloading temporary copy: $($Transfer.Label)"
  Invoke-WebRequest -Uri $downloadUrl -OutFile $dest -UseBasicParsing -TimeoutSec 0
  return @{ Path = $dest; Temporary = $true }
}

function Upload-ToNomad {
  param($Transfer, [string]$LocalPath, [string]$Token)
  Ensure-NomadDirectory -Dir $Transfer.NomadDir -Token $Token

  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (!$curl) { throw "curl.exe was not found. It is included with modern Windows; add it to PATH and retry." }

  Write-Host ""
  Write-Host "Uploading: $($Transfer.Label)"
  Write-Host "Target: $($Transfer.NomadDir)/$($Transfer.RemoteName)"

  $args = @("-f", "--progress-bar", "-X", "POST")
  if (![string]::IsNullOrWhiteSpace($Token)) {
    $args += @("-H", "X-Admin-Token: $Token")
  }
  $args += @(
    "-F", "dir=$($Transfer.NomadDir)",
    "-F", "file=@$LocalPath;filename=$($Transfer.RemoteName)",
    "$NomadUrl/upload"
  )

  & $curl.Source @args
  if ($LASTEXITCODE -ne 0) {
    throw "Upload failed for $($Transfer.Label) with curl exit code $LASTEXITCODE."
  }
}

function Request-Reindex {
  param([string[]]$Dirs, [string]$Token)
  $roots = $Dirs | ForEach-Object {
    if ($_ -like "/Movies*") { "/Movies" }
    elseif ($_ -like "/Shows*") { "/Shows" }
    else { $_ }
  } | Sort-Object -Unique

  foreach ($root in $roots) {
    try {
      Write-Host "Requesting Nomad reindex: $root"
      [void](Invoke-NomadPost -Path ("/api/reindex?path=" + [uri]::EscapeDataString($root)) -Body @{} -Token $Token)
    } catch {
      Write-Warning "Could not request reindex for ${root}: $($_.Exception.Message)"
    }
  }
}

$PlexUrl = Normalize-BaseUrl $PlexUrl
$NomadUrl = Normalize-BaseUrl $NomadUrl

if ([string]::IsNullOrWhiteSpace($PlexToken)) {
  $PlexToken = Get-PlexTokenFromPreferences
}
if ([string]::IsNullOrWhiteSpace($PlexToken)) {
  $PlexToken = Read-Host "Plex token"
}
if ([string]::IsNullOrWhiteSpace($PlexToken)) {
  throw "A Plex token is required. Set PLEX_TOKEN or pass -PlexToken."
}

Write-Host "Connecting to Plex: $PlexUrl"
$sections = Invoke-PlexXml "/library/sections"
$libraries = @($sections.MediaContainer.Directory) | Where-Object {
  (Get-NodeValue $_ "type") -in @("movie", "show")
}
if (!$libraries) { throw "No movie or show libraries were returned by Plex." }

Write-Host ""
Write-Host "Plex libraries:"
Show-Choices $libraries { param($x) "$(Get-NodeValue $x 'title') ($(Get-NodeValue $x 'type'))" }
$library = @(Select-NumberedItems -Items $libraries -Prompt "Choose one library")[0]
if (!$library) { throw "No library selected." }

$libraryKey = Get-NodeValue $library "key"
$libraryType = Get-NodeValue $library "type"
$term = Read-Host "Search title (leave blank to list recent/all)"

$transfers = @()
if ($libraryType -eq "movie") {
  $xml = Invoke-PlexXml "/library/sections/$libraryKey/all"
  $movies = @($xml.MediaContainer.Video)
  if ($term) { $movies = $movies | Where-Object { (Get-NodeValue $_ "title") -like "*$term*" } }
  $movies = @($movies | Select-Object -First $MaxResults)
  if (!$movies) { throw "No matching movies found." }

  Write-Host ""
  Write-Host "Movies:"
  Show-Choices $movies { param($x) "$(Get-NodeValue $x 'title') $(Get-NodeValue $x 'year')" }
  $selected = Select-NumberedItems -Items $movies
  $transfers = @($selected | ForEach-Object { New-MovieTransfer $_ } | Where-Object { $_ })
} else {
  $xml = Invoke-PlexXml "/library/sections/$libraryKey/all"
  $shows = @($xml.MediaContainer.Directory)
  if ($term) { $shows = $shows | Where-Object { (Get-NodeValue $_ "title") -like "*$term*" } }
  $shows = @($shows | Select-Object -First $MaxResults)
  if (!$shows) { throw "No matching shows found." }

  Write-Host ""
  Write-Host "Shows:"
  Show-Choices $shows { param($x) "$(Get-NodeValue $x 'title') ($(Get-NodeValue $x 'leafCount') episodes)" }
  $show = @(Select-NumberedItems -Items $shows -Prompt "Choose one show")[0]
  if (!$show) { throw "No show selected." }

  $showKey = Get-NodeValue $show "ratingKey"
  $episodeXml = Invoke-PlexXml "/library/metadata/$showKey/allLeaves"
  $episodes = @($episodeXml.MediaContainer.Video)
  if (!$episodes) { throw "No episodes returned for this show." }

  Write-Host ""
  Write-Host "Episodes:"
  Show-Choices $episodes {
    param($x)
    "S{0:00}E{1:00} - {2}" -f [int](Get-NodeValue $x "parentIndex"), [int](Get-NodeValue $x "index"), (Get-NodeValue $x "title")
  }
  $selected = Select-NumberedItems -Items $episodes
  $transfers = @($selected | ForEach-Object { New-EpisodeTransfer $_ } | Where-Object { $_ })
}

if (!$transfers) { throw "No transferable media files were selected." }

Write-Host ""
Write-Host "Connecting to Nomad: $NomadUrl"
$nomadToken = Get-NomadSessionToken

$uploadedDirs = New-Object System.Collections.Generic.List[string]
foreach ($transfer in $transfers) {
  $resolved = Resolve-TransferFile $transfer
  if (!$resolved) {
    Write-Warning "Skipped $($transfer.Label)"
    continue
  }

  try {
    Upload-ToNomad -Transfer $transfer -LocalPath $resolved.Path -Token $nomadToken
    $uploadedDirs.Add($transfer.NomadDir)
  } finally {
    if ($resolved.Temporary -and (Test-Path -LiteralPath $resolved.Path)) {
      Remove-Item -LiteralPath $resolved.Path -Force
    }
  }
}

if ($uploadedDirs.Count -gt 0) {
  Request-Reindex -Dirs $uploadedDirs.ToArray() -Token $nomadToken
  Write-Host ""
  Write-Host "Done. Uploaded $($uploadedDirs.Count) item(s)."
} else {
  Write-Warning "No files were uploaded."
}
