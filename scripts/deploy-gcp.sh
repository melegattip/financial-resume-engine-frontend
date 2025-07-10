#!/bin/bash

# Script para deployment del frontend en GCP Cloud Run
# Autor: AI Assistant
# Fecha: $(date)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_ID="financial-resume-prod-464920"
REGION="southamerica-east1"
SERVICE_NAME="financial-resume-frontend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando deployment del frontend en GCP...${NC}"

# Verificar autenticación con GCP
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Verificando autenticación con GCP...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}❌ No hay una cuenta activa de GCP. Ejecuta 'gcloud auth login' primero${NC}"
    exit 1
fi

# Configurar proyecto
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Configurando proyecto GCP: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Habilitar APIs necesarias
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Habilitando APIs necesarias...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Configurar Docker para GCR
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Configurando Docker para GCR...${NC}"
gcloud auth configure-docker

# Construir imagen Docker
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Construyendo imagen Docker...${NC}"
docker build -t ${IMAGE_NAME}:latest -f Dockerfile.simple .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagen construida exitosamente${NC}"
else
    echo -e "${RED}❌ Error construyendo la imagen${NC}"
    exit 1
fi

# Subir imagen a Google Container Registry
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Subiendo imagen a Google Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagen subida exitosamente${NC}"
else
    echo -e "${RED}❌ Error subiendo la imagen${NC}"
    exit 1
fi

# Desplegar servicio en Cloud Run
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Desplegando servicio en Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --set-env-vars="NODE_ENV=production"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completado exitosamente${NC}"
else
    echo -e "${RED}❌ Error en el deployment${NC}"
    exit 1
fi

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] URL del servicio: ${SERVICE_URL}${NC}"

# Probar el servicio
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Probando el servicio...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Servicio funcionando correctamente (HTTP ${HTTP_STATUS})${NC}"
else
    echo -e "${YELLOW}⚠️  Servicio responde con HTTP ${HTTP_STATUS}${NC}"
fi

# Configurar tag estable
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Configurando tag estable...${NC}"
LATEST_REVISION=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.latestReadyRevisionName)")
gcloud run services update-traffic ${SERVICE_NAME} --set-tags=stable=${LATEST_REVISION} --region=${REGION}

STABLE_URL="https://stable---${SERVICE_NAME}-ncf3kbolwa-rj.a.run.app"
echo -e "${GREEN}✅ Tag estable configurado: ${STABLE_URL}${NC}"

# Información del deployment
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Información del deployment:${NC}"
echo "  - Proyecto: ${PROJECT_ID}"
echo "  - Región: ${REGION}"
echo "  - Servicio: ${SERVICE_NAME}"
echo "  - URL Principal: ${SERVICE_URL}"
echo "  - URL Estable: ${STABLE_URL}"
echo "  - Imagen: ${IMAGE_NAME}:latest"

# Comandos útiles
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] Comandos útiles:${NC}"
echo "  - Ver logs: gcloud run logs read ${SERVICE_NAME} --region ${REGION}"
echo "  - Ver servicio: gcloud run services describe ${SERVICE_NAME} --region ${REGION}"
echo "  - Actualizar: ./scripts/deploy-gcp.sh"

echo -e "${GREEN}✅ Deployment completado exitosamente! 🎉${NC}" 