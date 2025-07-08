# Dockerfile mínimo - evita problemas de dependencias
FROM node:16-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json ./

# Instalar dependencias básicas sin package-lock
RUN npm install --no-package-lock --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Nginx para servir
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración nginx básica
RUN echo 'server { listen 80; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 