# ⚛️ Financial Resume Frontend - Dockerfile Optimizado
# Multi-stage build para aplicación React con Nginx

# ================================
# STAGE 1: BUILD
# ================================
FROM node:18-alpine AS builder

# Configurar zona horaria
ENV TZ=America/Sao_Paulo

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files primero (para cache de Docker layers)
COPY package*.json ./

# Instalar dependencias con flags para resolver conflictos
RUN npm install --legacy-peer-deps --force

# Copiar código fuente
COPY . .

# Build optimizado para producción con configuración mejorada
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV GENERATE_SOURCEMAP=false
ENV CI=false
RUN npm run build

# ================================
# STAGE 2: PRODUCTION
# ================================
FROM nginx:1.25-alpine

# Copiar archivos build desde stage anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Puerto del frontend (nginx)
EXPOSE 80

# Variables de entorno
ENV NODE_ENV=production

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"] 