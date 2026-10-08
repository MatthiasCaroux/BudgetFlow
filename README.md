# BudgetFlow

BudgetFlow est une petite application de suivi de budget : on crée un compte, on se connecte, puis on enregistre ses revenus et ses dépenses (fictifs). Chaque utilisateur ne voit que ses propres transactions. L'interface affiche aussi le total des revenus, des dépenses et le solde. Aucun accès bancaire, aucune transaction réelle.

Projet du module **Full Stack JS** (EFREI, Master 1), **sujet C – BudgetFlow**.

## Sommaire

1. [Démo](#1-démo)
2. [Fonctionnalités](#2-fonctionnalités)
3. [Stack et versions](#3-stack-et-versions)
4. [Prérequis](#4-prérequis)
5. [Installation et fichier .env](#5-installation-et-fichier-env)
6. [Lancer le projet](#6-lancer-le-projet)
7. [Les routes de l'API](#7-les-routes-de-lapi)
8. [Les pages du front](#8-les-pages-du-front)
9. [Tests, lint et build](#9-tests-lint-et-build)
10. [Architecture](#10-architecture)
11. [Choix techniques](#11-choix-techniques)
12. [Vite, Babel et Webpack](#12-vite-babel-et-webpack)
13. [Les tests dans une CI](#13-les-tests-dans-une-ci)
14. [Limites connues](#14-limites-connues)
15. [Équipe](#15-équipe)

## 1. Démo

Toutes les commandes sont à lancer **depuis la racine du projet**, dans l'ordre.

### Préparer (une seule fois)

```bash
npm install                              # dépendances du front et du back
cp backend/.env.example backend/.env     # fichier de configuration de l'API
openssl rand -hex 32                     # copier le résultat dans JWT_SECRET (backend/.env)
```

### Vérifier la qualité

```bash
npm run lint                             # ESLint : aucune erreur attendue
npm test                                 # les 135 tests Jest + Supertest
npm run build                            # build de production du front
git log -1 --format=%H                   # SHA du commit présenté
```

### Lancer l'application

```bash
docker compose up -d mongo               # MongoDB sur le port 27017
npm run dev                              # API (port 3000) + front (port 5173)
```

Dans un **second terminal** :

```bash
curl http://localhost:3000/api/health    # doit répondre {"status":"ok"}
```

| À ouvrir | Adresse |
|---|---|
| Application | http://localhost:5173 |
| Documentation Swagger | http://localhost:3000/api-docs |

### Démonstration dans le navigateur

1. **Inscription** du compte A, puis déconnexion et **connexion**.
2. **Ajout** d'un revenu et d'une dépense : les montants s'affichent en euros (`12345` centimes → `123,45 €`) et le solde se met à jour.
3. **Détail** d'une transaction, **modification**, puis **suppression** avec confirmation.
4. Saisie invalide (libellé vide, montant à 0) : message d'erreur lisible.
5. **Compte B** dans une fenêtre de navigation privée : sa liste est vide, il ne voit rien du compte A.
6. **Persistance** : arrêter `npm run dev` (Ctrl+C), le relancer, recharger la page : les transactions sont toujours là.

### Démonstration de l'API (sécurité et contrat)

À coller dans le second terminal, bloc par bloc. Les emails contiennent l'heure pour pouvoir relancer la démo sans conflit.

```bash
API=http://localhost:3000/api
N=$(date +%s)

# Inscription des comptes A et B (201) : on récupère leur JWT
TOKEN_A=$(curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"a$N@example.test\",\"password\":\"MotDePasse123!\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')
TOKEN_B=$(curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"b$N@example.test\",\"password\":\"MotDePasse123!\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')

# A crée une transaction (201) et on garde son id
ID=$(curl -s -X POST $API/transactions -H "Authorization: Bearer $TOKEN_A" -H 'Content-Type: application/json' \
  -d '{"label":"Courses","amount":12345,"type":"expense","date":"2026-10-05"}' | sed -E 's/.*"id":"([^"]+)".*/\1/')
echo "Transaction de A : $ID"
```

```bash
# A liste ses transactions (200, enveloppe {"items":[...]})
curl -s $API/transactions -H "Authorization: Bearer $TOKEN_A"; echo

# B ne voit rien (200, {"items":[]}) et reçoit 404 sur la transaction de A
curl -s $API/transactions -H "Authorization: Bearer $TOKEN_B"; echo
curl -s -w ' → %{http_code}\n' $API/transactions/$ID -H "Authorization: Bearer $TOKEN_B"
curl -s -w ' → %{http_code}\n' -X PATCH $API/transactions/$ID -H "Authorization: Bearer $TOKEN_B" \
  -H 'Content-Type: application/json' -d '{"label":"Piraté"}'
curl -s -w ' → %{http_code}\n' -X DELETE $API/transactions/$ID -H "Authorization: Bearer $TOKEN_B"

# Sans JWT ou avec un JWT falsifié : 401
curl -s -w ' → %{http_code}\n' $API/transactions
curl -s -w ' → %{http_code}\n' $API/transactions -H 'Authorization: Bearer faux.jeton.jwt'

# Entrées invalides : 400 (montant décimal, ownerId envoyé par le client, id mal formé)
curl -s -w ' → %{http_code}\n' -X POST $API/transactions -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' -d '{"label":"Courses","amount":12.34,"type":"expense","date":"2026-10-05"}'
curl -s -w ' → %{http_code}\n' -X PATCH $API/transactions/$ID -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' -d '{"ownerId":"507f1f77bcf86cd799439011"}'
curl -s -w ' → %{http_code}\n' $API/transactions/pas-un-id -H "Authorization: Bearer $TOKEN_A"

# A modifie (200), supprime (204), puis la transaction n'existe plus (404)
curl -s -w ' → %{http_code}\n' -X PATCH $API/transactions/$ID -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' -d '{"amount":5000}'
curl -s -w ' → %{http_code}\n' -X DELETE $API/transactions/$ID -H "Authorization: Bearer $TOKEN_A"
curl -s -w ' → %{http_code}\n' $API/transactions/$ID -H "Authorization: Bearer $TOKEN_A"

# Email déjà utilisé (409) et mauvais mot de passe (401)
curl -s -w ' → %{http_code}\n' -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"a$N@example.test\",\"password\":\"MotDePasse123!\"}"
curl -s -w ' → %{http_code}\n' -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"a$N@example.test\",\"password\":\"mauvais-mdp\"}"
```

Les mêmes appels peuvent être faits depuis **Swagger** (http://localhost:3000/api-docs) : bouton **Authorize**, coller le token, puis **Try it out** sur une route.

### Montrer les tests et la couverture

```bash
npm test                                 # toute la suite : 135 tests Jest + Supertest
npm run test:unitaires                   # tests unitaires : validateurs, dates, gestion des erreurs (sans base)
npm run test:fonctionnels                # tests fonctionnels : appels HTTP sur l'API, dont l'isolation A/B
npm run test:coverage                    # toute la suite + tableau de couverture du code (environ 98 %)
```

Le rapport de couverture s'affiche dans le terminal. Une version HTML détaillée, fichier par fichier, est générée dans `backend/coverage/lcov-report/index.html` (dossier ignoré par Git) : on peut l'ouvrir dans le navigateur pour montrer les lignes testées.

Le test d'isolation est dans `backend/test/fonctionnels/isolation.test.js` : si on retire le filtre `ownerId` dans `backend/src/services/transactionService.js`, il échoue.

### Après la démo

```bash
docker compose down                      # arrête MongoDB (les données restent dans le volume)
```

## 2. Fonctionnalités

- **Compte utilisateur** : inscription, connexion, déconnexion. Mot de passe haché avec bcrypt, session par JWT.
- **Transactions** : lister, ajouter, consulter, modifier et supprimer ses transactions (libellé, montant, type revenu/dépense, date, description facultative).
- **Résumé** : total des revenus, des dépenses et solde du compte.
- **Données privées** : un utilisateur ne voit et ne modifie que ses propres transactions, y compris si quelqu'un appelle l'API directement sans passer par l'interface.
- **Session sécurisée** : déconnexion automatique à l'expiration du token, redirection vers la connexion pour les pages privées, retour à la page demandée après connexion.

## 3. Stack et versions

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
| Tests | Jest + Supertest | 30.5 / 7.1 (couverture V8) |
| Tests | mongodb-memory-server | 11.3 |
| Qualité | ESLint (+ plugins React Hooks et React Refresh) | 9 |

Les versions sont celles installées par `npm ci` avec le `package-lock.json` actuel.

Pourquoi Node 20.19 minimum : c'est ce que demandent Mongoose 9, Vite 7 et mongodb-memory-server. Les images Docker utilisent Node 24.

## 4. Prérequis

- Node.js 20.19 ou plus récent, avec npm (`node -v` pour vérifier)
- Docker Desktop (ou Docker Engine + Compose), pour lancer MongoDB sans l'installer
- Git

Si vous n'avez pas Docker, un MongoDB installé en local marche aussi, il doit juste écouter sur `localhost:27017`.

## 5. Installation et fichier .env

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

## 6. Lancer le projet

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

## 7. Les routes de l'API

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

## 8. Les pages du front

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

## 9. Tests, lint et build

Toutes les commandes se lancent depuis la racine du projet.

### Tests (back)

```bash
npm test                  # tous les tests
npm run test:unitaires    # tests unitaires seulement
npm run test:fonctionnels # tests fonctionnels seulement
npm run test:coverage     # tous les tests + taux de couverture du code de backend/src (environ 98 %)
```

- Les tests unitaires (`backend/test/unitaires`) testent des fonctions seules, sans base de données : validation des transactions et des emails / mots de passe, vérification des dates, `AppError`, middleware d'erreurs.
- Les tests fonctionnels (`backend/test/fonctionnels`) envoient de vraies requêtes HTTP à l'API avec Supertest : inscription et connexion, CRUD des transactions, montants et dates invalides, et isolation entre deux comptes (le compte B reçoit 404 sur les transactions du compte A).

Les tests fonctionnels utilisent une base MongoDB en mémoire (mongodb-memory-server), donc ils ne touchent pas à la base de dev et Docker n'a pas besoin d'être lancé. Par contre, au premier lancement, la librairie télécharge le binaire MongoDB (environ 140 Mo) : il faut une connexion internet et ça peut prendre une minute.

Le rapport de couverture s'affiche dans le terminal. Une version HTML détaillée, fichier par fichier, est générée dans `backend/coverage/lcov-report/index.html` (dossier ignoré par Git).

Le secret JWT utilisé pendant les tests est défini dans `backend/test/outils/env.js`, ce n'est jamais celui du `.env`.

### Lint

```bash
npm run lint
```

Analyse tout le code (back, tests et front) avec ESLint, sans l'exécuter : variables non déclarées ou inutilisées, règles des hooks React… La configuration unique est à la racine, dans `eslint.config.js`, avec un bloc par environnement (Node pour le back, Node + Jest pour les tests, navigateur + JSX pour le front). On peut aussi n'analyser qu'une partie avec `npm run lint --workspace backend` ou `--workspace frontend`, et corriger automatiquement ce qui peut l'être avec `npx eslint . --fix`.

**Ce que la configuration ESLint ne couvre pas :**

- **Pas de `eslint-plugin-react`.** ESLint seul ne sait pas qu'un composant utilisé en JSX (`<Link />`) est utilisé. Dans le front, les variables inutilisées dont le nom commence par une majuscule sont donc ignorées (comme dans le modèle officiel de Vite) : un composant importé mais jamais affiché n'est pas signalé. Les règles propres à React (props, `key` dans les listes…) ne sont pas vérifiées non plus.
- **Pas de règles de style ni de formatage** (indentation, guillemets, points-virgules) : seules les règles recommandées, qui visent les erreurs probables, sont actives. Aucun formateur comme Prettier n'est configuré.
- **Une règle désactivée sur une ligne** : `react-refresh/only-export-components` pour le hook `useAuth`, exporté dans le même fichier que `AuthProvider` (`frontend/src/context/AuthContext.jsx`). Conséquence limitée au développement : modifier ce fichier recharge toute la page au lieu d'un rechargement à chaud.
- **Pas d'exécution automatique** : le lint n'est lancé ni avant chaque commit (pas de hook Git), ni par une chaîne d'intégration continue. Il faut lancer `npm run lint` soi-même.

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

## 10. Architecture

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
│   │   ├── unitaires/
│   │   ├── fonctionnels/
│   │   └── outils/              base en mémoire, création d'un utilisateur de test
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

## 11. Choix techniques

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

## 12. Vite, Babel et Webpack

**Vite** est l'outil qu'on utilise pour le front. Il a deux rôles :
- en dev (`npm run dev`), il sert les fichiers presque tels quels au navigateur, qui sait lire les modules ES (`import`/`export`). Il ne transforme que le fichier demandé, donc le démarrage est quasi instantané. Avec le plugin React, les modifications apparaissent sans recharger la page (Fast Refresh). Il fait aussi le proxy `/api` vers l'API ;
- au build (`npm run build`), il regroupe et minifie tout le code dans quelques fichiers optimisés pour la production, dans `frontend/dist`.

**Babel** est un transpileur : il transforme du code JavaScript en un autre code JavaScript. Il sert surtout à convertir le JSX (`<div>`) en appels de fonctions que le navigateur comprend, et à réécrire la syntaxe récente pour les vieux navigateurs. Dans notre projet on ne le configure pas nous-mêmes : le plugin `@vitejs/plugin-react` l'utilise en dev pour le Fast Refresh, et Vite s'appuie sur esbuild pour le reste des transformations.

**Webpack** est un bundler plus ancien, qu'on retrouve dans beaucoup de projets existants (Create React App par exemple). Il fait le même travail de fond que Vite (regrouper les modules, gérer le CSS et les images, produire un build), mais il construit tout le bundle avant de démarrer, même en dev, et demande plus de configuration. On ne l'utilise pas dans ce projet : Vite démarre plus vite, se configure en quelques lignes, et c'est l'outil recommandé aujourd'hui pour un nouveau projet React.

## 13. Les tests dans une CI

Une CI (intégration continue) est un serveur qui relance automatiquement les vérifications à chaque push ou Pull Request. Dans notre projet, une PR ne devrait être fusionnée dans `develop` que si tout passe.

L'ordre logique :

1. `npm ci` : installation exacte à partir du `package-lock.json` ;
2. `npm run lint` : erreurs de style et bugs simples, très rapide ;
3. `npm run test:unitaires` : rapides, sans base de données ;
4. `npm run test:fonctionnels` : plus lents, avec la base en mémoire ;
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
      - run: npm run test:unitaires
      - run: npm run test:fonctionnels
      - run: npm run build
```

Pas besoin de service MongoDB dans la CI, puisque les tests fonctionnels utilisent la base en mémoire.

## 14. Limites connues

- Pas de refresh token : au bout d'une heure il faut se reconnecter.
- La déconnexion se fait seulement côté navigateur. Un token copié avant la déconnexion reste valable jusqu'à son expiration (il n'y a pas de liste de tokens révoqués).
- Le token est dans `localStorage`, donc lisible en cas de faille XSS (voir la partie 11).
- Pas de limite du nombre de tentatives de connexion : un mot de passe peut être testé en boucle.
- Pas de pagination : `GET /api/transactions` renvoie toutes les transactions d'un coup.
- Le seul filtre de la liste est `type`. Pas de filtre par date ni de catégories.
- Le solde affiché est calculé dans le front à partir de la liste, il n'y a pas de route dédiée.
- Pas de tests automatisés côté front, seulement des tests manuels dans le navigateur.
- Pas de modification ni de suppression du compte utilisateur.
- Une seule devise (€).

## 15. Équipe

| Membre | Contribution principale |
|---|---|
| Nabila | Comptes et sécurité : inscription, connexion, JWT, protection des routes, session côté React, tests d'authentification et d'isolation |
| Matthias Caroux | Transactions : modèle, routes, interface de la liste et de l'ajout, Swagger |
| Pierre Zhou | Infrastructure et qualité : Docker (API et front), gestion centralisée des erreurs (`AppError`), séparation des tests unitaires et fonctionnels, accessibilité et mise en page |
| Romain | Documentation technique : contrat de l'API, flux JWT, architecture en couches, choix techniques, procédures d'installation et de test (README.md) |
