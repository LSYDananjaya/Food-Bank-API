# Build all Docker images
$services = @(
    "api-gateway",
    "user-service",
    "restaurant-service",
    "menu-service",
    "cart-service",
    "order-service",
    "table-service",
    "notification-service",
    "search-service",
    "user-activity-service",
    "payment-service",
    "delivery-service"
)

Write-Host "Building Docker images..."
foreach ($service in $services) {    Write-Host "Building $service..."
    docker build -t "$service`:latest" "../$service"
}

Write-Host "All images built successfully!"
