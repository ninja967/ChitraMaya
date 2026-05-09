$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_REPO_URL) {
    $env:GITHUB_REPO_URL = "https://github.com/ninja967/ChitraMaya.git"
}

if (-not $env:HF_SPACE_REPO) {
    throw "Set HF_SPACE_REPO, for example https://huggingface.co/spaces/<user>/<space>"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "chitramaya"
$githubStage = Join-Path $env:TEMP ("chitramaya_github_" + [guid]::NewGuid().ToString("N"))
$hfStage = Join-Path $env:TEMP ("chitramaya_hf_" + [guid]::NewGuid().ToString("N"))

function Copy-CleanTree($from, $to) {
    New-Item -ItemType Directory -Path $to | Out-Null
    robocopy $from $to /E /XD node_modules .venv __pycache__ dist outputs datasets output .git /XF *.pyc | Out-Null
    if ($LASTEXITCODE -le 7) {
        $global:LASTEXITCODE = 0
    } else {
        throw "robocopy failed with exit code $LASTEXITCODE"
    }
}

try {
    Copy-CleanTree $source $githubStage
    Push-Location $githubStage
    git init -b main
    git add .
    git commit -m "Initial ChitraMaya release"
    git remote add origin $env:GITHUB_REPO_URL
    git push --force origin main
    Pop-Location

    Push-Location (Join-Path $source "dashboard")
    npm.cmd install
    npm.cmd run build
    Pop-Location

    Copy-CleanTree (Join-Path $source "hosting") $hfStage
    New-Item -ItemType Directory -Path (Join-Path $hfStage "public") -Force | Out-Null
    Copy-Item -Path (Join-Path $source "dashboard\dist\*") -Destination (Join-Path $hfStage "public") -Recurse -Force

    Push-Location $hfStage
    git init -b main
    git add .
    git commit -m "Initial ChitraMaya Space release"
    git remote add origin $env:HF_SPACE_REPO
    git push --force origin main
    Pop-Location
} finally {
    while ((Get-Location).Path -ne $root) {
        Pop-Location
    }
    Remove-Item -LiteralPath $githubStage -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $hfStage -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Clean-history publish complete."
