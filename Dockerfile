# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --force
COPY . .

# Las variables de entorno se pasan desde docker-compose.yml
# ENV REACT_APP_API_URL=http://localhost:8080/api/v1
# ENV REACT_APP_ENVIRONMENT=development
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage - servidor HTTP simple de Node.js
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/build ./public
COPY server.js ./

EXPOSE 8080
CMD ["node", "server.js"] 