param(
  [switch]$RunGenerate
)

$ErrorActionPreference = 'Stop'

$required = 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'STUDENT_EMAIL', 'STUDENT_PASSWORD'
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Missing environment variable: $name"
  }
}

$apiBase = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd('/') } else { 'http://localhost:3000/api/v1' }
$tempFile = Join-Path $env:TEMP ('careerbridge-recommendations-' + [guid]::NewGuid().ToString() + '.json')

function Login([string]$email, [string]$password) {
  $payload = @{ email = $email; password = $password } | ConvertTo-Json -Compress
  $body = & curl.exe -sS -X POST "$apiBase/auth/login" -H 'Content-Type: application/json' -d $payload
  $response = $body | ConvertFrom-Json
  if (-not $response.success) { throw "Login failed for $email" }
  return $response.data.accessToken
}

function Invoke-Curl([string[]]$arguments) {
  $status = & curl.exe -sS -o $tempFile -w '%{http_code}' @arguments
  return [pscustomobject]@{
    Status = [string]$status
    Body = Get-Content -Raw $tempFile
  }
}

function Expect-Status([string]$name, [string]$expected, [string[]]$arguments) {
  $result = Invoke-Curl $arguments
  if ($result.Status -ne $expected) {
    throw "${name}: expected $expected, got $($result.Status). $($result.Body)"
  }
  Write-Host "${name}: $expected"
  return $result
}

$originalPreferences = $null
try {
  $adminToken = Login $env:ADMIN_EMAIL $env:ADMIN_PASSWORD
  $studentToken = Login $env:STUDENT_EMAIL $env:STUDENT_PASSWORD
  $adminHeader = "Authorization: Bearer $adminToken"
  $studentHeader = "Authorization: Bearer $studentToken"

  Expect-Status 'Recommendation without token' '401' @("$apiBase/recommendations/internships/me") | Out-Null
  Expect-Status 'Admin recommendation denied' '403' @('-H', $adminHeader, "$apiBase/recommendations/internships/me") | Out-Null
  Expect-Status 'Student recommendation cache' '200' @('-H', $studentHeader, "$apiBase/recommendations/internships/me") | Out-Null

  $preferences = Expect-Status 'Get preferences' '200' @('-H', $studentHeader, "$apiBase/students/me/job-preferences")
  $originalPreferences = ($preferences.Body | ConvertFrom-Json).data
  Expect-Status 'Invalid preferences rejected' '400' @('-X', 'PUT', '-H', $studentHeader, '-H', 'Content-Type: application/json', '-d', '{"desiredRoles":"Backend Developer","preferredLocations":[],"preferredWorkTypes":[]}', "$apiBase/students/me/job-preferences") | Out-Null

  $testPreferences = @{ desiredRoles = @('Backend Developer', 'backend developer'); preferredLocations = @('Hồ Chí Minh'); preferredWorkTypes = @('Hybrid') } | ConvertTo-Json -Compress
  Expect-Status 'Update preferences' '200' @('-X', 'PUT', '-H', $studentHeader, '-H', 'Content-Type: application/json', '-d', $testPreferences, "$apiBase/students/me/job-preferences") | Out-Null
  $updated = Expect-Status 'Read updated preferences' '200' @('-H', $studentHeader, "$apiBase/students/me/job-preferences")
  $updatedData = ($updated.Body | ConvertFrom-Json).data
  if ($updatedData.desiredRoles.Count -ne 1 -or $updatedData.desiredRoles[0] -ne 'Backend Developer') {
    throw 'Preference normalization failed'
  }

  if ($RunGenerate) {
    $generated = Expect-Status 'Generate recommendations' '200' @('-X', 'POST', '-H', $studentHeader, '-H', 'Content-Type: application/json', '-d', '{"force":false}', "$apiBase/recommendations/internships/me/generate")
    $generatedData = ($generated.Body | ConvertFrom-Json).data
    if (-not $generatedData.hasRecommendation) { throw 'Generate did not return a recommendation result' }
    if ($generatedData.recommendations.Count -gt 10) { throw 'Recommendation result exceeds top-10 contract' }
    if (@($generatedData.recommendations | Where-Object { $_.rank -gt 3 -and $null -ne $_.aiExplanation }).Count -gt 0) {
      throw 'A recommendation outside top three contains an AI explanation'
    }
    Write-Output "Generate source: $($generatedData.source); count: $($generatedData.recommendations.Count)"
    Expect-Status 'Cached recommendation after generate' '200' @('-H', $studentHeader, "$apiBase/recommendations/internships/me") | Out-Null
    Expect-Status 'Force refresh cooldown' '429' @('-X', 'POST', '-H', $studentHeader, '-H', 'Content-Type: application/json', '-d', '{"force":true}', "$apiBase/recommendations/internships/me/generate") | Out-Null
  }

  Write-Output 'AI recommendations curl regression: PASS'
}
finally {
  if ($null -ne $originalPreferences) {
    $restore = @{
      desiredRoles = @($originalPreferences.desiredRoles)
      preferredLocations = @($originalPreferences.preferredLocations)
      preferredWorkTypes = @($originalPreferences.preferredWorkTypes)
    } | ConvertTo-Json -Compress
    & curl.exe -sS -o 'NUL' -X PUT "$apiBase/students/me/job-preferences" -H $studentHeader -H 'Content-Type: application/json' -d $restore
  }
  Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
}
