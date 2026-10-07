# BudgetFlow

// test

## Démarrage

Copier `backend/.env.example` en `backend/.env`, puis au choix :

**Développement** (rechargement automatique)
```bash
npm install
docker compose up -d mongo   # MongoDB seul
npm run dev                  # API sur :3000, front sur :5173
```

**Application complète dans Docker**
```bash
docker compose up -d --build
```
Front sur http://localhost:8080, API sur http://localhost:3000, Swagger sur http://localhost:3000/api-docs.

## Tests

```bash
npm test                  # tous les tests
npm run test:unit         # backend/test/unit : fonctions isolées, sans base de données
npm run test:functional   # backend/test/functional : appels HTTP sur l'API, MongoDB en mémoire
```
