$ErrorActionPreference = 'Stop'

$required = 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'STUDENT_EMAIL', 'STUDENT_PASSWORD'
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Missing environment variable: $name"
  }
}

$apiBase = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd('/') } else { 'http://localhost:3000/api/v1' }
$tempFile = Join-Path $env:TEMP ('careerbridge-audit-' + [guid]::NewGuid().ToString() + '.json')

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
  Write-Output "${name}: $expected"
  return $result
}

try {
  $adminToken = Login $env:ADMIN_EMAIL $env:ADMIN_PASSWORD
  $studentToken = Login $env:STUDENT_EMAIL $env:STUDENT_PASSWORD
  $adminHeader = "Authorization: Bearer $adminToken"
  $studentHeader = "Authorization: Bearer $studentToken"

  Expect-Status 'No token' '401' @("$apiBase/audit-logs") | Out-Null
  Expect-Status 'Student denied' '403' @('-H', $studentHeader, "$apiBase/audit-logs") | Out-Null
  $list = Expect-Status 'Admin list' '200' @('-H', $adminHeader, "$apiBase/audit-logs?page=1&limit=20")
  Expect-Status 'Invalid page' '400' @('-H', $adminHeader, "$apiBase/audit-logs?page=0") | Out-Null
  Expect-Status 'Invalid limit' '400' @('-H', $adminHeader, "$apiBase/audit-logs?limit=101") | Out-Null
  Expect-Status 'Invalid calendar date' '400' @('-H', $adminHeader, "$apiBase/audit-logs?from=2026-02-30") | Out-Null
  Expect-Status 'Invalid user id' '400' @('-H', $adminHeader, "$apiBase/audit-logs?userId=invalid") | Out-Null
  Expect-Status 'Inverted date range' '400' @('-H', $adminHeader, "$apiBase/audit-logs?from=2026-08-31&to=2026-08-01") | Out-Null
  Expect-Status 'Read-only route' '404' @('-X', 'POST', '-H', $adminHeader, "$apiBase/audit-logs") | Out-Null

  $items = ($list.Body | ConvertFrom-Json).data.items
  if ($items.Count -gt 0) {
    $auditId = $items[0].id
    Expect-Status 'Existing detail' '200' @('-H', $adminHeader, "$apiBase/audit-logs/$auditId") | Out-Null
  }
  Expect-Status 'Unknown detail' '404' @('-H', $adminHeader, "$apiBase/audit-logs/not-a-real-audit-id") | Out-Null

  Write-Output 'Week 7 Audit curl regression: PASS'
}
finally {
  Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
}