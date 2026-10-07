# Image de l'API. Se construit depuis la racine du dépôt (voir docker-compose.yml),
# car package-lock.json est partagé par les workspaces npm.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

# Dépendances d'abord : cette couche reste en cache tant que les package.json ne changent pas
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --omit=dev && npm cache clean --force

COPY backend/src backend/src

# Pas de droits root dans le conteneur
USER node
EXPOSE 3000
CMD ["node", "backend/src/server.js"]
