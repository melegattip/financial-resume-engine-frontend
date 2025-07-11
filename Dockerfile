# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --force
COPY . .
ENV REACT_APP_API_URL=https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1
ENV REACT_APP_ENV=production
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage - servidor HTTP simple de Node.js
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/build ./public
COPY server.js ./

EXPOSE 8080
CMD ["node", "server.js"] 