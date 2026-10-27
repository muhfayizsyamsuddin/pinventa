
param(
  [string]$Location = "Raffles Place, Singapore",
  [int]$RadiusKm = 3,
  [string]$Industry = "professional",
  [string]$BaseUrl = "http://localhost:3000"
)

# Usage:
# powershell -ExecutionPolicy Bypass -File scripts/test-discover.ps1
# powershell -ExecutionPolicy Bypass -File scripts/test-discover.ps1 -Location "Singapore" -RadiusKm 3 -Industry professional

$body = @{
  location = $Location
  radiusKm = $RadiusKm
  industry = $Industry
} | ConvertTo-Json -Compress

$status = 0
$content = ""

try {
  $r = Invoke-WebRequest `
    -Uri "$($BaseUrl.TrimEnd('/'))/api/discover" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing `
    -TimeoutSec 90 `
    -ErrorAction Stop

  $status = [int]$r.StatusCode
  $content = [string]$r.Content
}
catch {
  $exception = $_.Exception
  $response = $exception.Response

  if ($null -ne $response) {
    try {
      $status = [int]$response.StatusCode
    }
    catch {
      $status = 0
    }

    try {
      # Windows PowerShell 5.1 response objects.
      if ($response.PSObject.Methods.Name -contains "GetResponseStream") {
        $stream = $response.GetResponseStream()

        if ($null -ne $stream) {
          $reader = [System.IO.StreamReader]::new($stream)

          try {
            $content = $reader.ReadToEnd()
          }
          finally {
            $reader.Dispose()
          }
        }
      }
      # PowerShell versions that expose HttpResponseMessage.
      elseif ($null -ne $response.Content) {
        $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      }
    }
    catch {
      # Preserve the original error if reading the response fails.
    }
  }

  if ([string]::IsNullOrWhiteSpace($content)) {
    $content = $exception.Message
  }
}

if ($status -gt 0) {
  "HTTP $status"
}
else {
  "HTTP request failed"
}

try {
  $j = $content | ConvertFrom-Json -ErrorAction Stop
}
catch {
  "Response is not valid JSON, or the server could not be reached."
  if (-not [string]::IsNullOrWhiteSpace($content)) {
    "Details: $content"
  }
  exit 1
}

if ($status -lt 200 -or $status -ge 300 -or $null -eq $j -or -not $j.ok) {
  if ($null -ne $j.error) {
    $j.error | ConvertTo-Json -Depth 5
  }
  else {
    "Discover request failed."
  }

  exit 1
}

"Center: $($j.center.lat), $($j.center.lng) [$($j.center.source)] $($j.center.label)"
$j.meta | ConvertTo-Json -Compress

$businesses = @($j.businesses)
$withWeb = @($businesses | Where-Object { $_.websiteUrl }).Count
$withPhone = @($businesses | Where-Object { $_.phoneNumber }).Count
$withEmail = @($businesses | Where-Object { $_.email }).Count
$withAddr = @($businesses | Where-Object { $_.address }).Count

"Businesses: $($businesses.Count) | address: $withAddr | website: $withWeb | phone: $withPhone | email: $withEmail"

$businesses |
  Select-Object name, category,
    @{n = 'km'; e = { [math]::Round($_.distanceKm, 2) } },
    completeness, osmUrl |
  Format-Table -AutoSize |
  Out-String -Width 250
