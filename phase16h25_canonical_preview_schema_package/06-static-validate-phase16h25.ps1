$ErrorActionPreference = "Stop"

$packageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $packageFolder "SHA256SUMS.txt"

$expectedFileSet = @(
    "00-preview-read-only-preflight.sql",
    "01-preview-schema-payload.sql",
    "02-preview-transactional-application-utf8-corrected.sql",
    "03-preview-read-only-schema-verification.sql",
    "04-preview-transactional-privilege-correction.sql",
    "05-preview-read-only-privilege-verification.sql",
    "06-static-validate-phase16h25.ps1",
    "README-PHASE16H25.md",
    "SHA256SUMS.txt"
)

foreach ($file in $expectedFileSet) {
    $path = Join-Path $packageFolder $file
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "STOPPED: required package file is missing: $path"
    }
}

$strictUtf8 = New-Object System.Text.UTF8Encoding($false, $true)

function Read-TextStrict {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, $strictUtf8)
}

function Get-AnchoredMatchCount {
    param([string]$Text, [string]$Pattern)
    return [regex]::Matches(
        $Text,
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor
        [System.Text.RegularExpressions.RegexOptions]::Multiline
    ).Count
}

function Read-HashManifest {
    param([string]$Path)

    $manifest = [ordered]@{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        if ($line -notmatch '^([A-F0-9]{64})\s{2}(.+)$') {
            throw "STOPPED: invalid manifest line: $line"
        }

        $manifest[$Matches[2]] = $Matches[1].ToUpperInvariant()
    }

    return $manifest
}

function Test-SelectOnlyFile {
    param([string]$Text)

    $withoutComments = [regex]::Replace($Text, '(?im)^\s*--.*$', '')
    $trimmed = $withoutComments.Trim()

    return ($trimmed -match '^(with|select)\b') -and
        -not [regex]::IsMatch($Text, '(?im)^\s*(grant|revoke|alter|create|drop|insert|update|delete|truncate|copy)\b')
}

$manifest = Read-HashManifest -Path $manifestPath

$preflightPath = Join-Path $packageFolder "00-preview-read-only-preflight.sql"
$schemaPath = Join-Path $packageFolder "01-preview-schema-payload.sql"
$applicationPath = Join-Path $packageFolder "02-preview-transactional-application-utf8-corrected.sql"
$schemaVerificationPath = Join-Path $packageFolder "03-preview-read-only-schema-verification.sql"
$correctionPath = Join-Path $packageFolder "04-preview-transactional-privilege-correction.sql"
$privilegeVerificationPath = Join-Path $packageFolder "05-preview-read-only-privilege-verification.sql"
$readmePath = Join-Path $packageFolder "README-PHASE16H25.md"
$validatorPath = Join-Path $packageFolder "06-static-validate-phase16h25.ps1"

$preflight = Read-TextStrict -Path $preflightPath
$schema = Read-TextStrict -Path $schemaPath
$application = Read-TextStrict -Path $applicationPath
$schemaVerification = Read-TextStrict -Path $schemaVerificationPath
$correction = Read-TextStrict -Path $correctionPath
$privilegeVerification = Read-TextStrict -Path $privilegeVerificationPath
$readme = Read-TextStrict -Path $readmePath
$validator = Read-TextStrict -Path $validatorPath
$manifestText = Read-TextStrict -Path $manifestPath

$actualHashes = [ordered]@{}
foreach ($file in $expectedFileSet | Where-Object { $_ -ne "SHA256SUMS.txt" }) {
    $actualHashes[$file] = (Get-FileHash -LiteralPath (Join-Path $packageFolder $file) -Algorithm SHA256).Hash.ToUpperInvariant()
}

$expectedManifestKeys = @(
    "00-preview-read-only-preflight.sql",
    "01-preview-schema-payload.sql",
    "02-preview-transactional-application-utf8-corrected.sql",
    "03-preview-read-only-schema-verification.sql",
    "04-preview-transactional-privilege-correction.sql",
    "05-preview-read-only-privilege-verification.sql",
    "06-static-validate-phase16h25.ps1",
    "README-PHASE16H25.md",
    "EMBEDDED-SCHEMA-PAYLOAD"
)

$manifestKeys = @($manifest.Keys)
$hashMatches = @($actualHashes.GetEnumerator() | Where-Object { $manifest[$_.Key] -eq $_.Value }).Count -eq $actualHashes.Count

$wrapperText = ($readme + "`n" + $manifestText)
$allSqlText = ($preflight + "`n" + $schema + "`n" + $application + "`n" + $schemaVerification + "`n" + $correction + "`n" + $privilegeVerification)

$checks = [ordered]@{
    ManifestHasExpectedEntries = (@($manifestKeys | Sort-Object) -join '|') -eq (@($expectedManifestKeys | Sort-Object) -join '|')
    ManifestHashesMatchFiles = $hashMatches
    EmbeddedSchemaPayloadHashMatchesManifest = $manifest["EMBEDDED-SCHEMA-PAYLOAD"] -eq $actualHashes["01-preview-schema-payload.sql"]
    PreflightHashMatchesExpected = $actualHashes["00-preview-read-only-preflight.sql"] -eq "26D84F72BC95CE143DC06F67BCBAC7E8631A236332C92AD543244B9E25EABF7E"
    SchemaPayloadHashMatchesExpected = $actualHashes["01-preview-schema-payload.sql"] -eq "202606E35550562292F9740651DA949DE4F3D5A99154742E48F679EF3FFEC480"
    CorrectedApplicationHashMatchesExpected = $actualHashes["02-preview-transactional-application-utf8-corrected.sql"] -eq "C098A44BC912532D92F93B2BB5FD3D1FAEF50C93BB161ED493997BDAF1CD90EF"
    SchemaVerificationHashMatchesExpected = $actualHashes["03-preview-read-only-schema-verification.sql"] -eq "3C5C77DB9CB4635BA6CECA3A2F79FD7FCFE7536947B334664817D1029C5A2180"
    PrivilegeCorrectionHashMatchesExpected = $actualHashes["04-preview-transactional-privilege-correction.sql"] -eq "C3C7243651CB0CFB020667705C75A7D243E56332362A1CCFC09B4C50CE856FD2"
    PrivilegeVerificationHashMatchesExpected = $actualHashes["05-preview-read-only-privilege-verification.sql"] -eq "421931ADFE0D0D586E6B326C98A1ABE998E78C79C0668380DA646B2ACBB6BDA1"
    ApplicationBeginsOnce = (Get-AnchoredMatchCount $application '^\s*begin\s*;\s*$') -eq 1
    ApplicationCommitsOnce = (Get-AnchoredMatchCount $application '^\s*commit\s*;\s*$') -eq 1
    CorrectionBeginsOnce = (Get-AnchoredMatchCount $correction '^\s*begin\s*;\s*$') -eq 1
    CorrectionCommitsOnce = (Get-AnchoredMatchCount $correction '^\s*commit\s*;\s*$') -eq 1
    NoRollbackStatements = -not [regex]::IsMatch($application + "`n" + $correction, '(?im)^\s*rollback\s*;')
    PreflightIsSelectOnly = Test-SelectOnlyFile -Text $preflight
    SchemaVerificationIsSelectOnly = Test-SelectOnlyFile -Text $schemaVerification
    PrivilegeVerificationIsSelectOnly = Test-SelectOnlyFile -Text $privilegeVerification
    SchemaPayloadStatesSourceDataExcluded = $schema.Contains('Source data rows') -and $schema.Contains('excluded')
    ApplicationStatesSourceDataExcluded = $application.Contains('Source data rows') -and $application.Contains('excluded')
    NoCopyDataBlocks = -not [regex]::IsMatch($allSqlText, '(?im)^\s*copy\b')
    NoSecretsOrDatabaseUrlsInWrapperFiles = -not [regex]::IsMatch($wrapperText, '(?i)(SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL|postgresql://|postgres://|apikey|api[_-]?key|secret|token|password|authorization|bearer|jwt)')
    NoHostedUrlsOrSchedulerWiringInWrapperFiles = -not [regex]::IsMatch($wrapperText, '(?i)(https?://|supabase\.co|vault\.|cron_secret|pg_net|\bnet\.http)')
    NoAbsoluteWorkstationPathsInWrapperFiles = -not [regex]::IsMatch($wrapperText, '(?i)[A-Z]:\\Users\\')
    ValidatorHasNoAbsoluteWorkstationPaths = -not [regex]::IsMatch($validator, '(?i)[A-Z]:\\Users\\')
}

$failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value })

Write-Host "Phase 16H.25 static validation"
$checks.GetEnumerator() | ForEach-Object {
    Write-Host ("{0}: {1}" -f $_.Key, $(if ($_.Value) { "PASS" } else { "FAIL" }))
}

Write-Host "Preflight SHA256:" $actualHashes["00-preview-read-only-preflight.sql"]
Write-Host "Schema payload SHA256:" $actualHashes["01-preview-schema-payload.sql"]
Write-Host "Corrected application SHA256:" $actualHashes["02-preview-transactional-application-utf8-corrected.sql"]
Write-Host "Schema verification SHA256:" $actualHashes["03-preview-read-only-schema-verification.sql"]
Write-Host "Privilege correction SHA256:" $actualHashes["04-preview-transactional-privilege-correction.sql"]
Write-Host "Privilege verification SHA256:" $actualHashes["05-preview-read-only-privilege-verification.sql"]
Write-Host "Preview contacted: NO"
Write-Host "Production contacted: NO"
Write-Host "SQL executed: NO"
Write-Host "Docker started: NO"

if ($failed.Count -gt 0) {
    throw "Phase 16H.25 static validation failed."
}

Write-Host "Phase 16H.25 canonical package: PASS"
