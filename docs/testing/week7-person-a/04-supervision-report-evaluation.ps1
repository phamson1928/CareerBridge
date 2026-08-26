$ErrorActionPreference = 'Stop'

$required = 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'STUDENT_EMAIL', 'STUDENT_PASSWORD', 'COMPANY_EMAIL', 'COMPANY_PASSWORD', 'LECTURER_EMAIL', 'LECTURER_PASSWORD', 'EVALUATION_PLACEMENT_ID'
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Missing environment variable: $name"
  }
}

$apiBase = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd('/') } else { 'http://localhost:3000/api/v1' }
$tempFile = Join-Path $env:TEMP ('careerbridge-evaluation-' + [guid]::NewGuid().ToString() + '.json')
$companyEvaluationId = $null
$lecturerEvaluationId = $null

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
  $companyToken = Login $env:COMPANY_EMAIL $env:COMPANY_PASSWORD
  $lecturerToken = Login $env:LECTURER_EMAIL $env:LECTURER_PASSWORD
  $adminHeader = "Authorization: Bearer $adminToken"
  $studentHeader = "Authorization: Bearer $studentToken"
  $companyHeader = "Authorization: Bearer $companyToken"
  $lecturerHeader = "Authorization: Bearer $lecturerToken"
  $placementId = $env:EVALUATION_PLACEMENT_ID

  $createPayload = @{ placementId = $placementId; score = 8.5; comment = 'Week 7 curl regression' } | ConvertTo-Json -Compress
  Expect-Status 'Student create denied' '403' @('-X', 'POST', '-H', $studentHeader, '-H', 'Content-Type: application/json', '-d', $createPayload, "$apiBase/evaluations") | Out-Null

  $companyCreated = Expect-Status 'Company creates evaluation' '201' @('-X', 'POST', '-H', $companyHeader, '-H', 'Content-Type: application/json', '-d', $createPayload, "$apiBase/evaluations")
  $companyEvaluationId = ($companyCreated.Body | ConvertFrom-Json).data.id
  Expect-Status 'Duplicate company evaluation' '409' @('-X', 'POST', '-H', $companyHeader, '-H', 'Content-Type: application/json', '-d', $createPayload, "$apiBase/evaluations") | Out-Null

  $updatePayload = @{ score = 9; comment = 'Updated by curl regression' } | ConvertTo-Json -Compress
  Expect-Status 'Company updates evaluation' '200' @('-X', 'PATCH', '-H', $companyHeader, '-H', 'Content-Type: application/json', '-d', $updatePayload, "$apiBase/evaluations/$companyEvaluationId") | Out-Null
  Expect-Status 'Student reads own evaluation' '200' @('-H', $studentHeader, "$apiBase/evaluations/$companyEvaluationId") | Out-Null
  Expect-Status 'Evaluation audit filter' '200' @('-H', $adminHeader, "$apiBase/audit-logs?entity=Evaluation&entityId=$companyEvaluationId") | Out-Null

  $lecturerCreated = Expect-Status 'Lecturer creates evaluation' '201' @('-X', 'POST', '-H', $lecturerHeader, '-H', 'Content-Type: application/json', '-d', $createPayload, "$apiBase/evaluations")
  $lecturerEvaluationId = ($lecturerCreated.Body | ConvertFrom-Json).data.id
  Expect-Status 'Lecturer updates evaluation' '200' @('-X', 'PATCH', '-H', $lecturerHeader, '-H', 'Content-Type: application/json', '-d', $updatePayload, "$apiBase/evaluations/$lecturerEvaluationId") | Out-Null

  Write-Output 'Week 6 Evaluation curl regression: PASS'
}
finally {
  if ($companyEvaluationId) {
    & curl.exe -sS -o $tempFile -w '%{http_code}' -X DELETE -H $companyHeader "$apiBase/evaluations/$companyEvaluationId" | Out-Null
  }
  if ($lecturerEvaluationId) {
    & curl.exe -sS -o $tempFile -w '%{http_code}' -X DELETE -H $lecturerHeader "$apiBase/evaluations/$lecturerEvaluationId" | Out-Null
  }
  Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
}