[CmdletBinding()]
param([string]$ApiUrl = 'https://treba.duckdns.org', [int]$Port = 3034)
$ErrorActionPreference = 'Stop'
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$next = Join-Path $repository 'node_modules\next\dist\bin\next'
if (!(Test-Path -LiteralPath $next)) { throw 'Run npm ci in treba-frontend first.' }
$stateDirectory = Join-Path $env:LOCALAPPDATA 'Treba\frontend'
New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
$stateFile = Join-Path $stateDirectory 'session.json'
if (Test-Path -LiteralPath $stateFile) {
    $previous = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $process = Get-CimInstance Win32_Process -Filter ('ProcessId=' + [int]$previous.ProcessId) -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -like ('*' + $next + '*') -and $previous.ApiUrl -eq $ApiUrl) {
        try { $null = Invoke-WebRequest -Uri ('http://localhost:' + $previous.Port + '/admin') -TimeoutSec 5; return ('http://localhost:' + $previous.Port + '/admin') } catch { }
    }
    if ($process -and $process.CommandLine -like ('*' + $next + '*')) { Stop-Process -Id $previous.ProcessId -ErrorAction SilentlyContinue }
}
while (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { $Port++ }
$stdout = Join-Path $stateDirectory ('frontend-' + $Port + '.log')
$stderr = Join-Path $stateDirectory ('frontend-' + $Port + '.error.log')
$oldApi = $env:TREBA_API_URL; $oldPublicApi = $env:NEXT_PUBLIC_API_URL
try {
    $env:TREBA_API_URL = $ApiUrl; $env:NEXT_PUBLIC_API_URL = $ApiUrl
    $process = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @(('"' + $next + '"'), 'dev', '--hostname', '127.0.0.1', '--port', $Port) -WorkingDirectory $repository -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
} finally { $env:TREBA_API_URL = $oldApi; $env:NEXT_PUBLIC_API_URL = $oldPublicApi }
@{ ProcessId=$process.Id; Port=$Port; ApiUrl=$ApiUrl } | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
$url = 'http://localhost:' + $Port + '/admin'
for ($attempt=0; $attempt -lt 90; $attempt++) {
    $process.Refresh(); if ($process.HasExited) { throw ('Frontend stopped. See ' + $stderr) }
    try { $null = Invoke-WebRequest -Uri $url -TimeoutSec 3; return $url } catch { Start-Sleep -Milliseconds 500 }
}
throw ('Frontend did not become ready. See ' + $stderr)
