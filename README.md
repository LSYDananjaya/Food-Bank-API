# Restaurant App Microservices

This repository contains a microservices-based restaurant application. Follow the instructions below to set up and deploy the application.

## Prerequisites

- Docker Desktop
- Kubernetes enabled in Docker Desktop
- kubectl CLI tool
- Node.js and npm

## Environment Files Setup

Create `.env` files in each service directory with the following configurations:

### API Gateway (api-gateway/.env)
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
```

### User Service (user-service/.env)
```
PORT=5002
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
ORDER_SERVICE_URL=http://order-service:5006
```

### Restaurant Service (restaurant-service/.env)
```
PORT=5003
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
USER_SERVICE_URL=http://user-service:5002
ORDER_SERVICE_URL=http://order-service:5006
MENU_SERVICE_URL=http://menu-service:5004
SEARCH_SERVICE_URL=http://search-service:5010
```

### Menu Service (menu-service/.env)
```
PORT=5004
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
SEARCH_SERVICE_URL=http://search-service:5010
```

### Cart Service (cart-service/.env)
```
PORT=5005
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
MENU_SERVICE_URL=http://menu-service:5004
```

### Order Service (order-service/.env)
```
PORT=5006
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
USER_SERVICE_URL=http://user-service:5002
RESTAURANT_SERVICE_URL=http://restaurant-service:5003
MENU_SERVICE_URL=http://menu-service:5004
CART_SERVICE_URL=http://cart-service:5005
NOTIFICATION_SERVICE_URL=http://notification-service:5008
SMS_SERVICE_URL=http://sms-service:5009
TABLE_SERVICE_URL=http://table-service:5007
```

### Table Service (table-service/.env)
```
PORT=5007
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
RESTAURANT_SERVICE_URL=http://restaurant-service:5003
```

### Notification Service (notification-service/.env)
```
PORT=5009
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
USER_SERVICE_URL=http://user-service:5002
ORDER_SERVICE_URL=http://order-service:5006
```

### Search Service (search-service/.env)
```
PORT=5010
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
RESTAURANT_SERVICE_URL=http://restaurant-service:5003
MENU_SERVICE_URL=http://menu-service:5004
ENABLE_SYNC_JOBS=true
```

### User Activity Service (user-activity-service/.env)
```
PORT=5011
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=270411
NODE_ENV=development
INTERNAL_API_KEY=<your-internal-api-key>
USER_SERVICE_URL=http://user-service:5002
ORDER_SERVICE_URL=http://order-service:5006
RESTAURANT_SERVICE_URL=http://restaurant-service:5003
```

### Delivery Service (delivery-service/.env)
```
PORT=5012
MONGO_URI=mongodb://mongodb:27017/restaurant-app
NODE_ENV=development
JWT_SECRET=270411
INTERNAL_API_KEY=<your-internal-api-key>
ORDER_SERVICE_URL=http://order-service:5006
USER_SERVICE_URL=http://user-service:5002
```

### Payment Service (payment-service/.env)
```
PORT=5009
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.aytmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
JWT_SECRET=270411
INTERNAL_API_KEY=<your-internal-api-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

> **Note**: 
> 1. Replace `<username>`, `<password>`, `<your-internal-api-key>`, `<your-stripe-secret-key>`, and `<your-stripe-webhook-secret>` with your actual values
> 2. Never commit sensitive information to version control
> 3. Make sure all services are running on their designated ports
> 4. All services are configured to run in development mode

### Generating Internal API Key

The internal API key is used for service-to-service communication. You can generate a secure key using one of these methods:

1. Using Node.js:
```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Using PowerShell:
```powershell
$key = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Output $key
```

3. Using OpenSSL (if installed):
```powershell
openssl rand -hex 32
```

Use the generated key as your `INTERNAL_API_KEY` in all service `.env` files. This key should be the same across all services to ensure they can communicate with each other securely.

## Building Docker Images

Run the following commands from the root directory to build all service images:

```powershell
# Build API Gateway
docker build -t api-gateway:latest ./api-gateway

# Build User Service
docker build -t user-service:latest ./user-service

# Build Restaurant Service
docker build -t restaurant-service:latest ./restaurant-service

# Build Menu Service
docker build -t menu-service:latest ./menu-service

# Build Cart Service
docker build -t cart-service:latest ./cart-service

# Build Order Service
docker build -t order-service:latest ./order-service

# Build Table Service
docker build -t table-service:latest ./table-service

# Build Notification Service
docker build -t notification-service:latest ./notification-service

# Build Search Service
docker build -t search-service:latest ./search-service

# Build User Activity Service
docker build -t user-activity-service:latest ./user-activity-service

# Build Payment Service
docker build -t payment-service:latest ./payment-service

# Build Delivery Service
docker build -t delivery-service:latest ./delivery-service
```

Alternatively, you can use the provided script in `kubernetes/build-images.ps1`.

## Setting up Docker Desktop with Kubernetes

1. Open Docker Desktop
2. Go to Settings
3. Click on Kubernetes
4. Check "Enable Kubernetes"
5. Click "Apply & Restart"
6. Wait for Kubernetes to be ready (green indicator in Docker Desktop)

## Deploying to Kubernetes

Deploy the services in the following order:

```powershell
# Apply secrets first
kubectl apply -f kubernetes/secrets.yaml

# Deploy MongoDB
kubectl apply -f kubernetes/mongodb-deployment.yaml

# Deploy services
kubectl apply -f kubernetes/user-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml
kubectl apply -f kubernetes/menu-service-deployment.yaml
kubectl apply -f kubernetes/cart-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/table-service-deployment.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
kubectl apply -f kubernetes/search-service-deployment.yaml
kubectl apply -f kubernetes/user-activity-service-deployment.yaml
kubectl apply -f kubernetes/payment-service-deployment.yaml
kubectl apply -f kubernetes/delivery-service-deployment.yaml

# Deploy API Gateway and its service
kubectl apply -f kubernetes/api-gateway-deployment.yaml
kubectl apply -f kubernetes/api-gateway-service.yaml

# Create persistent volume for menu uploads
kubectl apply -f kubernetes/menu-uploads-pvc.yaml
```

You can also use the provided script `kubernetes/deploy-all.ps1` (for Windows) or `kubernetes/deploy-all.sh` (for Linux/Mac).

## Verifying the Deployment

Check if all pods are running:

```powershell
kubectl get pods
```

Check services:

```powershell
kubectl get services
```

The API Gateway will be exposed on `localhost:3000` by default.

## Troubleshooting

To check logs for a specific service:

```powershell
kubectl logs -f deployment/<service-name>
```

To restart a deployment:

```powershell
kubectl rollout restart deployment/<service-name>
```

To delete all deployments and start fresh:

```powershell
kubectl delete -f kubernetes/
```
