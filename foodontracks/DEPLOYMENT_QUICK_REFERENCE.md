# 🚀 Quick Deployment Reference

## Local Testing

```powershell
# Build and test container
.\docker-build-test.ps1

# Access app
http://localhost:3000

# View logs
docker logs -f foodontracks-test

# Stop container
docker stop foodontracks-test
```

## AWS ECS Deployment

### Prerequisites
```powershell
# Configure AWS CLI
aws configure

# Set AWS Account ID
$AWS_ACCOUNT_ID = "YOUR_ACCOUNT_ID"
$AWS_REGION = "ap-south-1"
```

### 1. Setup Secrets
```powershell
.\setup-aws-secrets.ps1 -AwsRegion ap-south-1
```

### 2. Push to ECR
```powershell
.\docker-push-ecr.ps1 -AwsRegion ap-south-1 -RepositoryName foodontracks
```

### 3. Deploy to ECS
```powershell
.\deploy-ecs.ps1 -ClusterName foodontracks-cluster -ServiceName foodontracks-service
```

### 4. Create Service (First Time)
```powershell
aws ecs create-service \
  --cluster foodontracks-cluster \
  --service-name foodontracks-service \
  --task-definition foodontracks-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region ap-south-1
```

### Monitor
```powershell
# Service status
aws ecs describe-services --cluster foodontracks-cluster --services foodontracks-service

# View logs
aws logs tail /ecs/foodontracks --follow

# Task status
aws ecs list-tasks --cluster foodontracks-cluster
```

## Azure App Service Deployment

### Prerequisites
```powershell
# Login to Azure
az login

# Set variables
$RESOURCE_GROUP = "foodontracks-rg"
$ACR_NAME = "kalviumregistry"
$APP_NAME = "foodontracks-app"
```

### 1. Create Resources
```powershell
# Create resource group
az group create --name $RESOURCE_GROUP --location eastus

# Create ACR
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Create App Service Plan
az appservice plan create --name foodontracks-plan --resource-group $RESOURCE_GROUP --is-linux --sku B1
```

### 2. Build & Push
```powershell
# Build
docker build -t foodontracks .

# Login to ACR
az acr login --name $ACR_NAME

# Tag and push
docker tag foodontracks ${ACR_NAME}.azurecr.io/foodontracks:latest
docker push ${ACR_NAME}.azurecr.io/foodontracks:latest
```

### 3. Deploy
```powershell
# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan foodontracks-plan \
  --name $APP_NAME \
  --deployment-container-image-name ${ACR_NAME}.azurecr.io/foodontracks:latest

# Configure settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings DATABASE_URL="..." JWT_SECRET="..." PORT=3000 WEBSITES_PORT=3000
```

### Monitor
```powershell
# View logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# View metrics
az monitor metrics list --resource "/subscriptions/.../resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
```

## GitHub Actions CI/CD

### Setup Secrets

#### For AWS
```
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
```

#### For Azure
```
AZURE_ACR_USERNAME = kalviumregistry
AZURE_ACR_PASSWORD = ...
AZURE_CREDENTIALS = {... service principal JSON ...}
```

### Trigger Deployment
1. Push to `main` branch
2. Or manually: Actions → Select workflow → Run workflow

## Troubleshooting

### Container Won't Start
```powershell
# Check logs
docker logs foodontracks-test

# Check environment
docker exec -it foodontracks-test env

# Test health
curl http://localhost:3000/api/health
```

### Build Fails
```powershell
# Clean build
docker build --no-cache -t foodontracks .

# Check Dockerfile syntax
docker build --dry-run -t foodontracks .
```

### AWS ECS Issues
```powershell
# Describe task
aws ecs describe-tasks --cluster foodontracks-cluster --tasks <task-id>

# Check service events
aws ecs describe-services --cluster foodontracks-cluster --services foodontracks-service

# View logs
aws logs tail /ecs/foodontracks --follow
```

### Azure Issues
```powershell
# Check deployment logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Check configuration
az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP
```

## Performance Testing

### Load Test
```powershell
# Install Apache Bench
# Windows: choco install apache-httpd

# Run test
ab -n 1000 -c 10 http://your-app-url/
```

### Stress Test
```powershell
# Install wrk
# Windows: Download from GitHub

# Run test
wrk -t12 -c400 -d30s http://your-app-url/
```

## Useful Commands

### Docker
```powershell
# List containers
docker ps -a

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# View image size
docker images

# Inspect container
docker inspect foodontracks-test
```

### AWS CLI
```powershell
# List ECS clusters
aws ecs list-clusters

# List ECR repositories
aws ecr describe-repositories

# Get account ID
aws sts get-caller-identity --query Account --output text
```

### Azure CLI
```powershell
# List resource groups
az group list --output table

# List web apps
az webapp list --output table

# List container registries
az acr list --output table
```

## Cost Estimation

### AWS ECS (Monthly)
- Fargate (0.5 vCPU, 1GB): ~$15-20
- ALB: ~$18
- ECR: ~$1
- CloudWatch Logs: ~$5
- **Total: ~$40-50/month**

### Azure App Service (Monthly)
- B1 Plan: ~$13
- ACR Basic: ~$5
- Monitor: ~$5
- **Total: ~$25-30/month**

## Security Checklist

- ✅ Secrets in Secrets Manager / Key Vault
- ✅ Non-root user in container
- ✅ Image scanning enabled
- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ Private VPC/VNET networking
- ✅ Regular image updates

## Support

- Documentation: `CONTAINER_DEPLOYMENT.md`
- AWS Console: https://console.aws.amazon.com/ecs
- Azure Portal: https://portal.azure.com
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)

---

*Last Updated: January 2, 2026*
