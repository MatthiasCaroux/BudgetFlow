# BudgetFlow

BudgetFlow est une petite application de suivi de budget : on crée un compte, on se connecte, puis on enregistre ses revenus et ses dépenses (fictifs). Chaque utilisateur ne voit que ses propres transactions. L'interface affiche aussi le total des revenus, des dépenses et le solde.

## Sommaire

1. [Stack et versions](#1-stack-et-versions)
2. [Prérequis](#2-prérequis)
3. [Installation et fichier .env](#3-installation-et-fichier-env)
4. [Lancer le projet](#4-lancer-le-projet)
5. [Les routes de l'API](#5-les-routes-de-lapi)
6. [Les pages du front](#6-les-pages-du-front)
7. [Tests, lint et build](#7-tests-lint-et-build)
8. [Architecture](#8-architecture)
9. [Choix techniques](#9-choix-techniques)
10. [Vite, Babel et Webpack](#10-vite-babel-et-webpack)
11. [Les tests dans une CI](#11-les-tests-dans-une-ci)
12. [Limites connues](#12-limites-connues)

## 1. Stack et versions

Le projet est un monorepo avec des workspaces npm : `backend` et `frontend` partagent un seul `package-lock.json` à la racine.

| Partie | Outil | Version |
| --- | --- | --- |
| Runtime | Node.js | 22 ou 24 (minimum 20.19) |
| Base de données | MongoDB | 7 (image Docker `mongo:7`) |
| Back | Express | 5.2 |
| Back | Mongoose | 9.11 |
| Back | jsonwebtoken / bcrypt | 9.0 / 6.0 |
| Back | helmet, cors | 8.3, 2.8 |
| Back | swagger-jsdoc / swagger-ui-express | 6.3 / 5.0 |
| Front | React / React DOM | 19.3 |
| Front | React Router | 7.18 |
| Front | Vite (+ @vitejs/plugin-react) | 7.3 (plugin 5.2) |
| Tests | Jest + Supertest | 30.5 / 7.1 |
| Tests | mongodb-memory-server | 11.3 |

Les versions sont celles installées par `npm ci` avec le `package-lock.json` actuel.

Pourquoi Node 20.19 minimum : c'est ce que demandent Mongoose 9, Vite 7 et mongodb-memory-server. Les images Docker utilisent Node 24.

## 2. Prérequis

- Node.js 20.19 ou plus récent, avec npm (`node -v` pour vérifier)
- Docker Desktop (ou Docker Engine + Compose), pour lancer MongoDB sans l'installer
- Git

Si vous n'avez pas Docker, un MongoDB installé en local marche aussi, il doit juste écouter sur `localhost:27017`.

## 3. Installation et fichier .env

```bash
git clone https://github.com/MatthiasCaroux/BudgetFlow.git
cd BudgetFlow
npm install
```

Un seul `npm install` à la racine suffit, il installe les dépendances du back et du front.

Ensuite il faut créer le fichier `backend/.env` à partir de l'exemple :

```bash
# macOS / Linux / Git Bash
cp backend/.env.example backend/.env

# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env
```

Contenu du fichier :

| Variable | Exemple | À quoi elle sert |
| --- | --- | --- |
| `PORT` | `3000` | Port de l'API Express |
| `MONGO_URI` | `mongodb://localhost:27017/budgetflow` | Adresse de la base MongoDB |
| `JWT_SECRET` | une longue chaîne aléatoire | Clé qui signe les tokens JWT |
| `JWT_EXPIRES_IN` | `1h` | Durée de validité d'un token |
| `CORS_ORIGIN` | `http://localhost:5173` | Seule origine autorisée à appeler l'API depuis un navigateur |

Il faut changer `JWT_SECRET`. Pour générer une valeur :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Le fichier `.env` est dans le `.gitignore`, il ne doit jamais être commité. Si `JWT_SECRET` ou `MONGO_URI` manque, l'API refuse de démarrer et affiche un message dans le terminal.

## 4. Lancer le projet

### Mode développement (celui qu'on utilise au quotidien)

Trois choses tournent en même temps : MongoDB, l'API et le front.

```bash
# 1. MongoDB dans Docker (à faire une fois, le conteneur reste lancé)
docker compose up -d mongo

# 2. L'API et le front en même temps
npm run dev
```

`npm run dev` lance les deux avec `concurrently` (logs en bleu pour le back, en vert pour le front). Les deux redémarrent tout seuls quand on modifie un fichier.

On peut aussi les lancer séparément, dans deux terminaux :

```bash
npm run dev --workspace backend    # API seule
npm run dev --workspace frontend   # front seul
```

Adresses :

| Quoi | URL |
| --- | --- |
| Application React | http://localhost:5173 |
| API | http://localhost:3000 |
| Vérifier que l'API répond | http://localhost:3000/api/health |
| Documentation Swagger | http://localhost:3000/api-docs |
| MongoDB | `mongodb://localhost:27017/budgetflow` |

En dev, le front appelle `/api/...` sur son propre port (5173) et Vite redirige ces requêtes vers `http://localhost:3000` (proxy configuré dans `frontend/vite.config.js`). C'est pour ça que le front n'a pas besoin de connaître l'URL de l'API.

Pour arrêter MongoDB : `docker compose stop mongo`. Les données sont gardées dans le volume Docker `mongo-data`, donc elles sont toujours là au prochain lancement. `docker compose down -v` supprime le volume et donc toutes les données.

### Tout dans Docker (proche de la version rendue)

```bash
docker compose up -d --build
```

Ça lance trois conteneurs : MongoDB, l'API (Node 24) et le front buildé servi par nginx.

| Quoi | URL |
| --- | --- |
| Application | http://localhost:8080 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api-docs |

nginx sert les fichiers du build React et transmet les requêtes `/api` au conteneur de l'API, comme le proxy de Vite en dev. Le conteneur de l'API lit `JWT_SECRET` et `JWT_EXPIRES_IN` dans `backend/.env`, il faut donc avoir créé ce fichier avant. `PORT`, `MONGO_URI` et `CORS_ORIGIN` sont redéfinis dans `docker-compose.yml`.

Pour tout arrêter : `docker compose down`.

## 5. Les routes de l'API

Toutes les réponses sont en JSON. Les routes `/api/transactions` demandent un token dans l'en-tête :

```
Authorization: Bearer <token>
```

Le token est renvoyé par `register` et `login`. La doc complète, avec les schémas et un bouton "Authorize" pour coller le token, est sur `/api-docs`.

### Vue d'ensemble

| Méthode | Route | Auth | Succès | Rôle |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | non | 200 | Vérifie que l'API tourne |
| POST | `/api/auth/register` | non | 201 | Crée un compte et renvoie un token |
| POST | `/api/auth/login` | non | 200 | Connecte et renvoie un token |
| GET | `/api/transactions` | oui | 200 | Liste les transactions de l'utilisateur |
| POST | `/api/transactions` | oui | 201 | Crée une transaction |
| GET | `/api/transactions/:id` | oui | 200 | Détail d'une transaction |
| PATCH | `/api/transactions/:id` | oui | 200 | Modifie une partie d'une transaction |
| DELETE | `/api/transactions/:id` | oui | 204 | Supprime une transaction (sans body) |

### Authentification

`POST /api/auth/register` et `POST /api/auth/login` prennent le même corps :

```json
{ "email": "romain@exemple.com", "password": "motdepasse123" }
```

Réponse (201 pour register, 200 pour login) :

```json
{
  "user": { "id": "66f1c2a4e1b2c3d4e5f60719", "email": "romain@exemple.com" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Règles :
- l'email doit être valide, il est enregistré en minuscules (`Romain@Exemple.com` et `romain@exemple.com` sont le même compte) ;
- le mot de passe fait au moins 8 caractères. Il est haché avec bcrypt, on ne stocke jamais le mot de passe en clair ;
- register avec un email déjà pris donne 409 `EMAIL_ALREADY_USED` ;
- login avec un mauvais email ou un mauvais mot de passe donne 401 avec le même message dans les deux cas, pour ne pas révéler quels emails ont un compte.

### Transactions

Une transaction ressemble à ça :

```json
{
  "id": "507f1f77bcf86cd799439012",
  "label": "Courses",
  "amount": 12345,
  "type": "expense",
  "date": "2026-10-05",
  "description": "",
  "ownerId": "66f1c2a4e1b2c3d4e5f60719",
  "createdAt": "2026-10-05T14:02:11.000Z",
  "updatedAt": "2026-10-05T14:02:11.000Z"
}
```

| Champ | Règle |
| --- | --- |
| `label` | texte, 1 à 120 caractères (les espaces au début et à la fin sont retirés) |
| `amount` | entier en centimes, strictement positif : `12345` = 123,45 € |
| `type` | `"income"` (revenu) ou `"expense"` (dépense) |
| `date` | texte `AAAA-MM-JJ`, et la date doit exister |
| `description` | facultatif, texte de 1000 caractères maximum (ajouté en plus du contrat) |

Le montant est toujours positif, c'est `type` qui dit si l'argent rentre ou sort.

**GET /api/transactions** renvoie `{ "items": [...] }`, trié de la date la plus récente à la plus ancienne. Si l'utilisateur n'a rien, on reçoit `{ "items": [] }`. On peut filtrer avec `?type=income` ou `?type=expense` (une autre valeur donne 400).

**POST /api/transactions** demande `label`, `amount`, `type` et `date`. Il renvoie 201 et la transaction créée. Le `ownerId` est pris dans le token, jamais dans le corps.

**GET /api/transactions/:id** renvoie la transaction si elle appartient à l'utilisateur connecté.

**PATCH /api/transactions/:id** modifie seulement les champs envoyés. Par exemple `{ "amount": 9900 }` change juste le montant. Un corps vide est refusé (400).

**DELETE /api/transactions/:id** renvoie 204 sans corps.

Ce qui est refusé avec un 400 `INVALID_INPUT` :
- `amount` à `12.34`, `0`, `-500` ou `"12"` (pas un entier positif) ;
- une date comme `2026-02-30` (bon format mais n'existe pas) ou `05/10/2026` ;
- un champ `id`, `_id`, `ownerId` ou n'importe quel champ inconnu dans un POST ou un PATCH ;
- un `:id` qui n'a pas le format d'un identifiant MongoDB (par exemple `/api/transactions/abc`) ;
- un JSON mal formé ou trop gros (plus de 10 ko).

### Format des erreurs

Toutes les erreurs ont la même forme :

```json
{ "error": { "code": "INVALID_INPUT", "message": "Le montant doit être un nombre entier de centimes strictement positif" } }
```

| Code HTTP | `code` | Quand |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | données invalides (voir la liste au-dessus) |
| 401 | `UNAUTHORIZED` | pas de token, token mal formé, falsifié ou expiré, mauvais identifiants au login |
| 404 | `NOT_FOUND` | transaction qui n'existe pas ou qui appartient à un autre compte, route inconnue |
| 409 | `EMAIL_ALREADY_USED` | email déjà utilisé à l'inscription |
| 500 | `INTERNAL_ERROR` | erreur imprévue (le détail reste dans les logs du serveur, pas dans la réponse) |

### Essayer avec curl

```bash
# Créer un compte et récupérer le token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"romain@exemple.com","password":"motdepasse123"}'

# Copier le token de la réponse dans une variable
TOKEN=colle-le-token-ici

# Créer une dépense de 123,45 €
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Courses","amount":12345,"type":"expense","date":"2026-10-05"}'

# Lister ses transactions
curl http://localhost:3000/api/transactions -H "Authorization: Bearer $TOKEN"
```

Sous Windows, le plus simple est d'utiliser Swagger (`/api-docs`) ou Git Bash.

## 6. Les pages du front

| URL | Page | Accès |
| --- | --- | --- |
| `/` | Accueil, présentation de l'appli | visiteurs (un utilisateur connecté est envoyé sur `/transactions`) |
| `/register` | Création de compte | visiteurs seulement |
| `/login` | Connexion | visiteurs seulement |
| `/transactions` | Liste, totaux (revenus, dépenses, solde) et ajout d'une transaction | connecté |
| `/transactions/:id` | Détail, modification et suppression (avec confirmation) | connecté |
| autre | Page 404 | tout le monde |

Si on ouvre une page protégée sans être connecté, on est redirigé vers `/login`, puis renvoyé sur la page demandée après la connexion.

Les montants sont saisis en euros (`123,45` ou `123.45`) et convertis en centimes avant l'envoi. L'affichage repasse en euros au format français (`123,45 €`).

## 7. Tests, lint et build

Toutes les commandes se lancent depuis la racine du projet.

### Tests (back)

```bash
npm test                  # tous les tests
npm run test:unit         # tests unitaires seulement
npm run test:functional   # tests fonctionnels seulement
```

- Les tests unitaires (`backend/test/unit`) testent des fonctions seules, sans base de données : validation des transactions et des emails / mots de passe, vérification des dates, `AppError`, middleware d'erreurs.
- Les tests fonctionnels (`backend/test/functional`) envoient de vraies requêtes HTTP à l'API avec Supertest : inscription et connexion, CRUD des transactions, montants et dates invalides, et isolation entre deux comptes (le compte B reçoit 404 sur les transactions du compte A).

Les tests fonctionnels utilisent une base MongoDB en mémoire (mongodb-memory-server), donc ils ne touchent pas à la base de dev et Docker n'a pas besoin d'être lancé. Par contre, au premier lancement, la librairie télécharge le binaire MongoDB (environ 140 Mo) : il faut une connexion internet et ça peut prendre une minute.

Le secret JWT utilisé pendant les tests est défini dans `backend/test/helpers/env.js`, ce n'est jamais celui du `.env`.

### Lint

```bash
npm run lint
```

Lance ESLint sur le back et sur le front.

### Build du front

```bash
npm run build
```

Le résultat va dans `frontend/dist/` (un `index.html`, un fichier JS et un fichier CSS minifiés). Pour voir ce build en local :

```bash
npm run preview --workspace frontend
```

Le back n'a pas d'étape de build : Node exécute directement les fichiers de `backend/src`.

### Lancer l'API sans rechargement automatique

```bash
npm start
```

## 8. Architecture

```
BudgetFlow/
├── backend/
│   ├── src/
│   │   ├── server.js            démarrage : vérifie le .env, connexion MongoDB, écoute du port
│   │   ├── app.js               configuration Express : middlewares, routes, gestion des erreurs
│   │   ├── config/              lecture du .env, connexion MongoDB, définition Swagger
│   │   ├── routes/              URLs et méthodes HTTP (+ commentaires Swagger)
│   │   ├── middlewares/         requireAuth (vérifie le JWT), errorHandler
│   │   ├── controllers/         lit la requête, appelle le validator puis le service, choisit le code HTTP
│   │   ├── validators/          règles sur les données reçues
│   │   ├── services/            logique métier et accès à la base
│   │   ├── models/              schémas Mongoose (User, Transaction)
│   │   ├── errors/              AppError et raccourcis (invalidInput, notFound...)
│   │   └── utils/               vérification des dates
│   ├── test/
│   │   ├── unit/
│   │   ├── functional/
│   │   └── helpers/             base en mémoire, création d'un utilisateur de test
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx             point d'entrée React
│   │   ├── App.jsx              déclaration des routes
│   │   ├── api/                 appels à l'API (client.js + un fichier par ressource)
│   │   ├── context/             AuthContext : session, login, logout
│   │   ├── components/          layout, routes protégées, formulaire, messages
│   │   ├── pages/               une page par URL
│   │   ├── hooks/               titre de l'onglet
│   │   └── utils/               conversion euros/centimes, format des dates
│   ├── vite.config.js
│   ├── nginx.conf               config du conteneur front
│   └── Dockerfile
├── docker-compose.yml
└── package.json                 workspaces et scripts communs
```

### Le trajet d'une requête dans le back

Exemple avec `POST /api/transactions` :

1. `app.js` : `helmet` ajoute des en-têtes de sécurité, `cors` vérifie l'origine, `express.json` lit le corps (10 ko max).
2. `routes/transactionRoute.js` : la route passe d'abord par `requireAuth`.
3. `middlewares/requireAuth.js` : vérifie le token et range l'id de l'utilisateur dans `req.userId`. Sinon, 401.
4. `controllers/transactionController.js` : appelle le validator. Si les données sont mauvaises, il lance une erreur 400.
5. `validators/transactionValidator.js` : vérifie chaque champ et refuse les champs en trop.
6. `services/transactionService.js` : crée la transaction avec `ownerId = req.userId`.
7. `models/Transaction.js` : Mongoose enregistre dans MongoDB et transforme `_id` en `id` dans la réponse.
8. Le controller renvoie 201 avec la transaction.

Si une erreur est lancée à n'importe quelle étape, Express 5 l'envoie à `middlewares/errorHandler.js`, qui la met au format `{ error: { code, message } }`. Grâce à ça, les controllers n'ont pas de `try/catch` : ils font juste `throw`.

On a séparé controllers, validators et services pour que chaque fichier ait un seul rôle. Les validators sont des fonctions simples, faciles à tester en unitaire sans lancer Express ni MongoDB.

### Côté front

Tous les appels passent par `frontend/src/api/client.js`. Il ajoute l'en-tête `Authorization`, lit le JSON, et transforme les erreurs de l'API en `ApiError` avec `status`, `code` et `message`, que les pages affichent. Si l'API répond 401 alors qu'on avait envoyé un token, le client prévient `AuthContext`, qui déconnecte l'utilisateur.

## 9. Choix techniques

### Montants en centimes

On stocke `12345` et pas `123.45`. Les nombres à virgule en JavaScript ne sont pas exacts (`0.1 + 0.2` donne `0.30000000000000004`), et sur des sommes d'argent ça finit par faire des centimes de différence. Avec des entiers, les additions sont exactes. Le serveur refuse tout montant qui n'est pas un entier.

Côté front, la conversion euros vers centimes (`utils/money.js`) découpe le texte saisi au lieu de faire `valeur * 100`, parce que `1.15 * 100` donne `114.99999999999999`.

### Dates en texte "AAAA-MM-JJ"

Une transaction a une date de calendrier, pas une heure précise. Si on la stockait en `Date`, elle serait enregistrée en UTC : une dépense du 5 octobre saisie en France pourrait s'afficher le 4 selon le fuseau. En texte, la date reste exactement celle saisie. Bonus : avec ce format, l'ordre alphabétique est aussi l'ordre chronologique, donc le tri MongoDB marche directement.

Le format seul ne suffit pas (`2026-02-30` le respecte), donc `utils/dates.js` reconstruit la date et vérifie qu'elle existe vraiment. Côté front, on découpe aussi la chaîne nous-mêmes au lieu de faire `new Date("2026-10-05")`, pour la même histoire de fuseau.

### Authentification par JWT

Au login, le serveur signe un token qui contient l'id de l'utilisateur (`sub`) et une date d'expiration (`exp`). Ensuite le client renvoie ce token à chaque requête. Le serveur n'a rien à stocker : il vérifie juste la signature avec `JWT_SECRET`. On n'accepte que l'algorithme HS256.

Un JWT est signé, pas chiffré : n'importe qui peut lire son contenu. On n'y met donc que l'id, rien de sensible.

Expiration : le token dure `JWT_EXPIRES_IN` (1 heure par défaut). Après, l'API répond 401. Le front lit la date `exp` du token et déconnecte l'utilisateur automatiquement à ce moment-là, avec un message qui explique que la session a expiré. Il n'y a pas de refresh token : il faut se reconnecter.

### Token stocké dans localStorage

Le token et l'email sont gardés dans `localStorage`, ce qui permet de rester connecté après un rechargement de page ou dans un autre onglet. Au chargement, si le token est déjà expiré, il est supprimé.

L'inconvénient : un script malveillant injecté dans la page (faille XSS) pourrait lire le token. React échappe le texte affiché par défaut, ce qui limite ce risque, mais ne le supprime pas. La solution plus sûre serait un cookie `httpOnly` (illisible en JavaScript), mais elle demande de gérer la protection CSRF. Pour la taille du projet on a gardé `localStorage`, plus simple à comprendre et à expliquer.

### Isolation des comptes

Toutes les requêtes sur les transactions filtrent par `ownerId`, qui vient du token et jamais du corps de la requête. Si A demande une transaction de B, la requête MongoDB ne trouve rien et on renvoie 404, comme si elle n'existait pas. On ne renvoie pas 403, pour ne même pas confirmer qu'un id existe.

Les redirections du front vers `/login` sont du confort d'affichage. La vraie protection est sur le serveur (`requireAuth` + filtre `ownerId`) : même en appelant l'API directement avec curl, on ne peut pas accéder aux données d'un autre compte.

### Gestion des erreurs centralisée

Un seul middleware (`errorHandler.js`) construit toutes les réponses d'erreur. Les erreurs prévues sont des `AppError` (avec un statut et un code). Une erreur imprévue donne un 500 avec un message générique : on n'envoie jamais de trace de pile au client, elle reste dans la console du serveur.

### Réponses sans `_id` ni `__v`

Le `toJSON` du modèle Transaction transforme `_id` en `id` (texte) et retire `__v`, pour respecter le contrat de l'API.

## 10. Vite, Babel et Webpack

**Vite** est l'outil qu'on utilise pour le front. Il a deux rôles :
- en dev (`npm run dev`), il sert les fichiers presque tels quels au navigateur, qui sait lire les modules ES (`import`/`export`). Il ne transforme que le fichier demandé, donc le démarrage est quasi instantané. Avec le plugin React, les modifications apparaissent sans recharger la page (Fast Refresh). Il fait aussi le proxy `/api` vers l'API ;
- au build (`npm run build`), il regroupe et minifie tout le code dans quelques fichiers optimisés pour la production, dans `frontend/dist`.

**Babel** est un transpileur : il transforme du code JavaScript en un autre code JavaScript. Il sert surtout à convertir le JSX (`<div>`) en appels de fonctions que le navigateur comprend, et à réécrire la syntaxe récente pour les vieux navigateurs. Dans notre projet on ne le configure pas nous-mêmes : le plugin `@vitejs/plugin-react` l'utilise en dev pour le Fast Refresh, et Vite s'appuie sur esbuild pour le reste des transformations.

**Webpack** est un bundler plus ancien, qu'on retrouve dans beaucoup de projets existants (Create React App par exemple). Il fait le même travail de fond que Vite (regrouper les modules, gérer le CSS et les images, produire un build), mais il construit tout le bundle avant de démarrer, même en dev, et demande plus de configuration. On ne l'utilise pas dans ce projet : Vite démarre plus vite, se configure en quelques lignes, et c'est l'outil recommandé aujourd'hui pour un nouveau projet React.

## 11. Les tests dans une CI

Une CI (intégration continue) est un serveur qui relance automatiquement les vérifications à chaque push ou Pull Request. Dans notre projet, une PR ne devrait être fusionnée dans `develop` que si tout passe.

L'ordre logique :

1. `npm ci` : installation exacte à partir du `package-lock.json` ;
2. `npm run lint` : erreurs de style et bugs simples, très rapide ;
3. `npm run test:unit` : rapides, sans base de données ;
4. `npm run test:functional` : plus lents, avec la base en mémoire ;
5. `npm run build` : vérifie que le front compile.

Si une étape échoue, la CI s'arrête et la PR est marquée en rouge. C'est comme ça qu'un test détecte une régression : si quelqu'un casse par exemple le filtre `ownerId`, le test d'isolation échoue avant que le code n'arrive dans `develop`.

Exemple avec GitHub Actions (fichier `.github/workflows/ci.yml`, pas encore ajouté au dépôt) :

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:functional
      - run: npm run build
```

Pas besoin de service MongoDB dans la CI, puisque les tests fonctionnels utilisent la base en mémoire.

## 12. Limites connues

- Pas de refresh token : au bout d'une heure il faut se reconnecter.
- La déconnexion se fait seulement côté navigateur. Un token copié avant la déconnexion reste valable jusqu'à son expiration (il n'y a pas de liste de tokens révoqués).
- Le token est dans `localStorage`, donc lisible en cas de faille XSS (voir la partie 9).
- Pas de limite du nombre de tentatives de connexion : un mot de passe peut être testé en boucle.
- Pas de pagination : `GET /api/transactions` renvoie toutes les transactions d'un coup.
- Le seul filtre de la liste est `type`. Pas de filtre par date ni de catégories.
- Le solde affiché est calculé dans le front à partir de la liste, il n'y a pas de route dédiée.
- Pas de tests automatisés côté front, seulement des tests manuels dans le navigateur.
- Pas de modification ni de suppression du compte utilisateur.
- Une seule devise (€)
