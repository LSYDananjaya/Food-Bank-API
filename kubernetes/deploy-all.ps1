# Check if Kubernetes is running
$kubeStatus = kubectl cluster-info
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Kubernetes is not running. Please make sure Docker Desktop is running and Kubernetes is enabled."
    exit 1
}

Write-Host "Kubernetes is running..."

# Create namespace if it doesn't exist
kubectl create namespace restaurant-app --dry-run=client -o yaml | kubectl apply -f -

# Apply infrastructure components first
Write-Host "Applying infrastructure components..."
kubectl apply -f kubernetes/secrets.yaml --validate=false
kubectl apply -f kubernetes/menu-uploads-pvc.yaml

# Deploy MongoDB first and wait for it
Write-Host "Deploying MongoDB..."
kubectl apply -f kubernetes/mongodb-deployment.yaml
Write-Host "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=300s

# Deploy core services
Write-Host "Deploying core services..."
kubectl apply -f kubernetes/user-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml
kubectl apply -f kubernetes/menu-service-deployment.yaml

# Wait for core services
Write-Host "Waiting for core services to be ready..."
kubectl wait --for=condition=ready pod -l app=user-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=restaurant-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=menu-service --timeout=300s

# Deploy dependent services
Write-Host "Deploying dependent services..."
kubectl apply -f kubernetes/cart-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/table-service-deployment.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
kubectl apply -f kubernetes/search-service-deployment.yaml
kubectl apply -f kubernetes/user-activity-service-deployment.yaml
kubectl apply -f kubernetes/payment-service-deployment.yaml
kubectl apply -f kubernetes/delivery-service-deployment.yaml
kubectl apply -f kubernetes/api-gateway-deployment.yaml

# Deploy API Gateway last
Write-Host "Deploying API Gateway..."
kubectl apply -f kubernetes/api-gateway-deployment.yaml
kubectl apply -f kubernetes/api-gateway-service.yaml

# Wait for dependent services
Write-Host "Waiting for dependent services to be ready..."
kubectl wait --for=condition=ready pod -l app=cart-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=order-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=table-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=notification-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=search-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=user-activity-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=payment-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=delivery-service --timeout=300s

# Wait for all pods to be ready
Write-Host "Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=300s

# Display status
Write-Host "`nDeployment complete! Here's the current status:"
kubectl get pods
kubectl get services

# Display API Gateway access information
$apiGatewayService = kubectl get service api-gateway -o jsonpath="{.status.loadBalancer.ingress[0].ip}"
if ($apiGatewayService) {
    Write-Host "`nAPI Gateway is accessible at http://$($apiGatewayService)"
} else {
    Write-Host "`nAPI Gateway is pending. Use 'kubectl get service api-gateway' to check its status."
}
