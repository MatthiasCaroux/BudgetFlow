# BudgetFlow

Application web de suivi de budget personnel : chaque utilisateur enregistre ses revenus et ses dépenses **fictifs**, et les retrouve à chaque connexion. Aucun accès bancaire, aucune transaction réelle.

Projet du module **Full Stack JS** (EFREI, Master 1), **sujet C – BudgetFlow**.

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack et versions](#stack-et-versions)
3. [Installation](#installation)
4. [Lancer l'application](#lancer-lapplication)
5. [Tests et build](#tests-et-build)
6. [API](#api)
7. [Architecture](#architecture)
8. [Choix techniques](#choix-techniques)
9. [Outillage : Vite, Babel, Webpack et CI](#outillage--vite-babel-webpack-et-ci)
10. [Limites connues](#limites-connues)
11. [Équipe](#équipe)

## Fonctionnalités

- **Compte utilisateur** : inscription, connexion, déconnexion. Mot de passe haché avec bcrypt, session par JWT.
- **Transactions** : lister, ajouter, consulter, modifier et supprimer ses transactions (libellé, montant, type revenu/dépense, date, description facultative).
- **Résumé** : total des revenus, des dépenses et solde du compte.
- **Données privées** : un utilisateur ne voit et ne modifie que ses propres transactions, y compris si quelqu'un appelle l'API directement sans passer par l'interface.
- **Session sécurisée** : déconnexion automatique à l'expiration du token, redirection vers la connexion pour les pages privées, retour à la page demandée après connexion.

## Stack et versions

| Couche | Technologies |
|---|---|
| Environnement | Node.js 24 (testé avec 24.21), npm 11 |
| Front-end | React 19, React Router 7, Vite 7 |
| Back-end | Express 5, Mongoose 9 |
| Base de données | MongoDB 7 |
| Sécurité | bcrypt 6, jsonwebtoken 9, helmet 8, cors |
| Tests | Jest 30, Supertest 7, mongodb-memory-server 11 |
| Documentation API | Swagger / OpenAPI 3 (swagger-jsdoc, swagger-ui-express) |

Le dépôt est un **monorepo npm** (workspaces) : `frontend/` et `backend/` sont deux projets indépendants, installés et lancés depuis la racine.

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) 24 ou plus récent, avec npm
- MongoDB 7, en local ou avec [Docker](https://www.docker.com/)

### Étapes

```bash
git clone https://github.com/MatthiasCaroux/BudgetFlow.git
cd BudgetFlow
npm install
cp backend/.env.example backend/.env
```

`npm install` à la racine installe les dépendances du front et du back en une seule fois.

Ouvrez ensuite `backend/.env` et remplacez au minimum `JWT_SECRET` par une longue chaîne aléatoire, par exemple générée avec :

```bash
openssl rand -hex 32
```

### Variables d'environnement (`backend/.env`)

| Variable | Rôle | Valeur d'exemple |
|---|---|---|
| `PORT` | Port de l'API | `3000` |
| `MONGO_URI` | Adresse de la base MongoDB | `mongodb://localhost:27017/budgetflow` |
| `JWT_SECRET` | Clé secrète de signature des tokens. **Ne jamais la partager ni la commiter** | une chaîne aléatoire de 64 caractères |
| `JWT_EXPIRES_IN` | Durée de validité d'un token | `1h` |
| `CORS_ORIGIN` | Adresse du front autorisée à appeler l'API depuis un navigateur | `http://localhost:5173` |

Le fichier `backend/.env` est ignoré par Git. Seul `backend/.env.example`, sans aucun secret, est versionné. L'API refuse de démarrer si `JWT_SECRET` ou `MONGO_URI` est absent.

### Lancer MongoDB

Avec Docker, depuis la racine du projet :

```bash
docker compose up -d mongo
```

Le conteneur redémarre automatiquement avec Docker, et ses données sont conservées dans un volume.

Sans Docker, installez [MongoDB Community](https://www.mongodb.com/try/download/community) et vérifiez qu'il écoute sur le port 27017. Les données sont conservées par MongoDB : elles restent disponibles après un redémarrage de l'API.

## Lancer l'application

Depuis la racine du projet :

```bash
npm run dev
```

Cette commande lance l'API et le front en même temps, avec rechargement automatique à chaque modification.

| Service | Adresse |
|---|---|
| Application (front) | http://localhost:5173 |
| API | http://localhost:3000 |
| Documentation Swagger | http://localhost:3000/api-docs |
| Santé de l'API | http://localhost:3000/api/health |

Si le port 5173 est déjà utilisé, Vite prend automatiquement le suivant (5174…) et l'affiche dans le terminal.

### Application complète dans Docker

Pour lancer MongoDB, l'API et le front sans rien installer d'autre que Docker :

```bash
cp backend/.env.example backend/.env   # puis modifier JWT_SECRET
docker compose up -d --build
```

| Service | Adresse |
|---|---|
| Application (front servi par nginx) | http://localhost:8080 |
| API | http://localhost:3000 |
| Documentation Swagger | http://localhost:3000/api-docs |

Dans ce mode, `MONGO_URI`, `PORT` et `CORS_ORIGIN` sont fixés par `docker-compose.yml` ; seuls `JWT_SECRET` et `JWT_EXPIRES_IN` sont lus dans `backend/.env`. Pour tout arrêter : `docker compose down`.

Autres commandes :

| Commande (à la racine) | Effet |
|---|---|
| `npm start` | Lance uniquement l'API, sans rechargement automatique |
| `npm run dev --workspace backend` | Lance uniquement l'API, avec rechargement |
| `npm run dev --workspace frontend` | Lance uniquement le front |

## Tests et build

```bash
npm test                  # tous les tests (135)
npm run test:unit         # tests unitaires : fonctions isolées, sans base de données
npm run test:functional   # tests fonctionnels : appels HTTP sur l'API, MongoDB en mémoire
```

**Tests unitaires** (`backend/test/unit/`) : validateurs (auth et transactions), vérification des dates, classe `AppError` et gestionnaire d'erreurs, testés sans serveur ni base.

**Tests fonctionnels** (`backend/test/functional/`), avec Jest + Supertest :

| Fichier | Ce qui est vérifié |
|---|---|
| `app.test.js` | La route de santé renvoie exactement `{"status":"ok"}` |
| `auth.test.js` | Inscription, connexion, email déjà utilisé (409), entrées invalides (400), mauvais identifiants (401), mot de passe stocké uniquement haché |
| `transactions.test.js` | Parcours CRUD complet, toutes les validations (montant décimal, nul ou négatif, date impossible, champ inconnu, `ownerId` envoyé par le client…), identifiants mal formés (400) ou absents (404), tri et filtre |
| `isolation.test.js` | Accès sans token, avec un token falsifié ou expiré (401) ; un compte B ne peut ni voir, ni modifier, ni supprimer les transactions d'un compte A (404) |

Les tests fonctionnels utilisent une **base MongoDB en mémoire**, créée pour l'occasion et vidée entre chaque test : ils ne touchent jamais à la base de développement. Le premier lancement télécharge cette base de test (environ 140 Mo), les suivants sont immédiats.

```bash
npm run build
```

Produit la version optimisée du front dans `frontend/dist/`. On peut la prévisualiser avec `npm run preview --workspace frontend`.

## API

Toutes les routes commencent par `/api` et échangent du JSON. La documentation complète et testable (schémas, exemples, bouton **Authorize** pour coller un token) est disponible sur **http://localhost:3000/api-docs**.

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `GET` | `/api/health` | public | `200` `{"status":"ok"}` |
| `POST` | `/api/auth/register` | public | `201` `{ user: { id, email }, token }` |
| `POST` | `/api/auth/login` | public | `200` `{ user: { id, email }, token }` |
| `GET` | `/api/transactions` | JWT | `200` `{ items: [...] }` |
| `POST` | `/api/transactions` | JWT | `201` transaction créée |
| `GET` | `/api/transactions/:id` | JWT | `200` transaction |
| `PATCH` | `/api/transactions/:id` | JWT | `200` transaction modifiée |
| `DELETE` | `/api/transactions/:id` | JWT | `204` sans corps |

Les routes « JWT » attendent l'en-tête `Authorization: Bearer <token>`.

Exemple de transaction :

```json
{
  "id": "507f1f77bcf86cd799439012",
  "label": "Courses",
  "amount": 12345,
  "type": "expense",
  "date": "2026-10-05",
  "description": "Supermarché"
}
```

`amount` est en **centimes** : `12345` correspond à 123,45 €.

Toutes les erreurs ont la même forme :

```json
{ "error": { "code": "INVALID_INPUT", "message": "Le montant doit être un nombre entier de centimes strictement positif" } }
```

| Code HTTP | `error.code` | Cas |
|---|---|---|
| 400 | `INVALID_INPUT` | Corps invalide, champ interdit (`id`, `ownerId`, champ inconnu), PATCH vide, identifiant mal formé |
| 401 | `UNAUTHORIZED` | Token absent, invalide ou expiré ; identifiants de connexion incorrects |
| 404 | `NOT_FOUND` | Transaction inexistante **ou appartenant à un autre compte** |
| 409 | `EMAIL_ALREADY_USED` | Email déjà utilisé à l'inscription |

## Architecture

```
Navigateur (React, port 5173)
   │  fetch('/api/...')  — le proxy Vite redirige /api vers le port 3000
   ▼
API Express (port 3000)
   │  route → requireAuth → validateur → contrôleur → service → modèle
   ▼
MongoDB (port 27017)
```

Une requête métier traverse toujours les mêmes étapes :

| Étape | Fichier | Rôle |
|---|---|---|
| Route | `routes/transactionRoute.js` | Associe une méthode et un chemin à un contrôleur |
| Authentification | `middlewares/requireAuth.js` | Vérifie le JWT, place l'id de l'utilisateur dans `req.userId`, sinon 401 |
| Validation | `validators/transactionValidator.js` | Vérifie le corps de la requête, sinon 400 |
| Contrôleur | `controllers/transactionController.js` | Lit la requête, appelle le service, choisit le code HTTP |
| Service | `services/transactionService.js` | Accès aux données, toujours filtré par propriétaire |
| Modèle | `models/Transaction.js` | Schéma Mongoose |
| Erreurs | `errors/AppError.js`, `middlewares/errorHandler.js` | Les erreurs prévues sont des `AppError` (400, 401, 404, 409) ; le gestionnaire les renvoie au format `{ error }`, et transforme toute erreur imprévue en 500 sans détail technique |

### Back-end (`backend/`)

```
src/
├── app.js            Application Express, importable sans ouvrir de port (tests)
├── server.js         Connexion à MongoDB et démarrage du serveur
├── config/           Variables d'environnement, connexion MongoDB, Swagger
├── routes/           authRoute, transactionRoute
├── middlewares/      requireAuth, errorHandler
├── errors/           AppError et raccourcis (invalidInput, unauthorized, notFound, conflict)
├── validators/       authValidator, transactionValidator
├── controllers/      authController, transactionController
├── services/         authService, transactionService
├── models/           User, Transaction
└── utils/            dates (vérification des dates réelles)
test/
├── unit/             Tests unitaires (validateurs, dates, erreurs)
├── functional/       Tests de l'API par HTTP (Supertest + MongoDB en mémoire)
└── helpers/          Base de test en mémoire, création d'utilisateurs, variables de test
Dockerfile            Image de l'API
```

### Front-end (`frontend/`)

```
src/
├── main.jsx          Point d'entrée : routeur et fournisseur de session
├── App.jsx           Déclaration des routes (publiques, visiteurs, protégées)
├── api/              client (appel unique à l'API, gestion des erreurs et du 401), auth, transactions
├── context/          AuthContext : session, connexion, déconnexion, expiration
├── components/       NavBar, ProtectedRoute, GuestRoute, TransactionModal, PasswordInput, messages
├── pages/            Accueil, Connexion, Inscription, Transactions, Détail, 404
├── hooks/            usePageTitle
└── utils/            money (euros ↔ centimes), dates
Dockerfile, nginx.conf   Image de production du front, servie par nginx
```

| Page | Accès |
|---|---|
| `/` | Accueil pour les visiteurs ; redirige vers `/transactions` si l'utilisateur est connecté |
| `/login`, `/register` | Visiteurs uniquement ; un utilisateur connecté est redirigé vers ses transactions |
| `/transactions`, `/transactions/:id` | Utilisateurs connectés uniquement ; sinon redirection vers `/login` |

## Choix techniques

**Montants en centimes entiers.** En JavaScript, `0.1 + 0.2` vaut `0.30000000000000004`. L'API ne manipule donc que des entiers (`12345` pour 123,45 €), et refuse les décimales. La conversion euros ↔ centimes est faite uniquement dans l'interface (`utils/money.js`), en découpant le texte saisi plutôt qu'en multipliant un nombre à virgule.

**Dates stockées en texte `AAAA-MM-JJ`.** Un objet `Date` JavaScript est en UTC : selon le fuseau horaire, le 5 octobre peut devenir le 4. En texte, la date renvoyée est exactement celle reçue, et l'ordre alphabétique correspond à l'ordre chronologique. L'API vérifie que la date existe (le 30 février est refusé).

**Mots de passe.** Ils ne sont jamais stockés ni renvoyés : seul un hash bcrypt (coût 10, sel aléatoire) est enregistré. L'email est stocké en minuscules, il est donc insensible à la casse.

**JWT.** Le token contient uniquement l'id de l'utilisateur (`sub`), il est signé avec `JWT_SECRET` (algorithme HS256 imposé) et expire au bout d'une heure. Son contenu est lisible par tous (il est encodé, pas chiffré) : il ne contient donc aucune donnée sensible. Sans `JWT_SECRET`, impossible de fabriquer un token valide.

**Stockage du token dans le navigateur.** Le token est gardé dans `localStorage`, pour que la session survive au rechargement de la page. Contrepartie : un script malveillant injecté dans la page (faille XSS) pourrait le lire. Un cookie `httpOnly` serait plus sûr, mais demande de gérer la protection CSRF. Nous limitons le risque avec une expiration courte, une déconnexion automatique à l'expiration et à chaque réponse 401, et React qui échappe par défaut le contenu affiché.

**Isolation des comptes.** Le propriétaire (`ownerId`) d'une transaction est toujours déduit du token vérifié, jamais du corps de la requête (un `ownerId` envoyé par le client est refusé). Chaque requête MongoDB filtre sur ce propriétaire : la transaction d'un autre compte est donc introuvable, et l'API répond **404**, exactement comme pour une transaction inexistante, sans révéler qu'elle existe.

**Sécurité côté serveur, pas seulement dans React.** Les protections de l'interface (pages réservées, validation des formulaires) servent le confort de l'utilisateur. N'importe qui peut appeler l'API avec `curl` ou Postman sans passer par React : toutes les vérifications sont donc refaites dans Express.

**Connexion.** Un email inconnu et un mauvais mot de passe donnent la même réponse (401, même message), pour ne pas révéler quels emails possèdent un compte.

**Autres protections.** En-têtes de sécurité HTTP avec helmet, CORS limité à l'adresse du front, corps JSON limité à 10 ko, aucune trace d'erreur technique renvoyée au client.

## Outillage : Vite, Babel, Webpack et CI

- **Vite** sert l'application en développement (démarrage instantané, rechargement à chaud) et produit le build de production. Son proxy redirige `/api` vers l'API : le front n'a pas besoin de connaître l'adresse du back.
- **Babel** est un *transpileur* : il transforme le JSX et le JavaScript récent en code que tous les navigateurs comprennent. Vite utilise esbuild, un outil équivalent beaucoup plus rapide, pour ce même rôle.
- **Webpack** est un *bundler* : il rassemble les nombreux fichiers d'une application en quelques fichiers optimisés. C'est l'outil historique, que Vite remplace ici (Vite s'appuie sur Rollup pour le build de production).
- **Intégration continue.** Dans une chaîne CI/CD, chaque push déclencherait : `npm ci`, puis `npm run test:unit` (rapide), `npm run test:functional`, puis `npm run build` et la construction des images Docker. Le déploiement n'aurait lieu que si toutes les étapes réussissent. Les tests utilisant une base en mémoire, ils tournent sans aucune base de données à installer.

## Limites connues

- Pas de catégories, de budgets mensuels, de graphiques ni d'export CSV (bonus du sujet non réalisés à ce jour).
- Le solde affiché est calculé dans l'interface à partir de la liste, et non par une route dédiée de l'API.
- Pas de limitation du nombre de tentatives de connexion (protection contre la force brute).
- Un token reste valable jusqu'à son expiration, même après une déconnexion : il n'existe pas de liste de révocation.
- Pas de pagination : toutes les transactions du compte sont chargées en une fois.
- Pas de modification de l'email, du mot de passe ni de suppression de compte.
- Pas de linter (ESLint) configuré à ce jour.

## Équipe

| Membre | Contribution principale |
|---|---|
| Nabila | Comptes et sécurité : inscription, connexion, JWT, protection des routes, session côté React, tests d'authentification et d'isolation |
| Matthias Caroux | Transactions : modèle, routes, interface de la liste et de l'ajout, Swagger |
