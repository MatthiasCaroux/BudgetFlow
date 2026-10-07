# Image du frontend. Se construit depuis la racine du dépôt (voir docker-compose.yml).

# 1. Build Vite
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend
COPY frontend frontend
RUN npm run build --workspace frontend

# 2. Fichiers statiques servis par nginx, qui relaie aussi /api vers le backend
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
