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

# Limpiar cache npm y instalar dependencias
RUN npm cache clean --force && npm install --silent

# Copiar código fuente
COPY . .

# Build optimizado para producción
RUN npm run build

# ================================
# STAGE 2: PRODUCTION
# ================================
FROM nginx:1.25-alpine

# Crear usuario no-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copiar archivos build desde stage anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Configurar permisos
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d

# Crear directorio para PID de nginx
RUN touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Cambiar a usuario no-root
USER appuser

# Puerto del frontend (nginx)
EXPOSE 80

# Variables de entorno
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"] 