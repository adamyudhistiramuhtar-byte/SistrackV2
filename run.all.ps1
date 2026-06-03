$ErrorActionPreference = "Stop"

function Start-Service($name, $path, $cmd) {
  Write-Host "Starting $name..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$path'; $cmd"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Service "auth-service"         "$root\backend\auth-service"         "npm i; node src/index.js"
Start-Service "product-service"      "$root\backend\product-service"      "npm i; node src/index.js"
Start-Service "order-service"        "$root\backend\order-service"        "npm i; node src/index.js"
Start-Service "notification-service" "$root\backend\notification-service" "npm i; node src/index.js"
Start-Service "analytics-service"    "$root\backend\analytics-service"    "npm i; node src/index.js"
Start-Service "gateway"              "$root\backend\gateway"              "npm i; node src/index.js"
Start-Service "frontend"             "$root\frontend"                     "npm i; npm run dev"
