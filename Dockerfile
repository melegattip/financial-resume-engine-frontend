# Dockerfile optimizado para evitar problemas de red
FROM node:18-alpine AS builder

WORKDIR /app

# Configurar npm para usar registry público y timeouts más largos
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set timeout 60000 && \
    npm config set fetch-timeout 60000

# Copiar package files
COPY package*.json ./

# Instalar dependencias con retry y configuración de red
RUN npm install --legacy-peer-deps --force --fetch-timeout=60000 --fetch-retry-maxtimeout=60000 --fetch-retry-mintimeout=10000

# Copiar código fuente
COPY . .

# Build con configuración optimizada
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV GENERATE_SOURCEMAP=false
ENV CI=false
RUN npm run build

# Nginx para servir
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración nginx simple
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 