#!/bin/sh
# Usar el puerto proporcionado por Cloud Run o 8080 por defecto
export PORT=${PORT:-8080}
echo "Starting nginx on port $PORT"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx -g "daemon off;" 