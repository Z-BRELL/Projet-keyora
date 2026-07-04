# 🏠 Keyora — Plateforme de Listings Immobiliers

Plateforme immobilière complète mettant en relation **vendeurs**, **acheteurs**, **agents** et **modérateurs**.

---

## 🚀 Démarrage rapide (5 minutes)

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- [Git](https://git-scm.com/)
- [Node.js 20+](https://nodejs.org/) (pour le développement local)

### 1. Cloner et configurer

```bash
git clone <votre-repo>
cd keyora

# Copier les variables d'environnement
cp .env.example .env
```

> **Éditez `.env`** pour renseigner vos clés Cloudinary, SMTP et JWT.

### 2. Lancer avec Docker (recommandé)

```bash
docker compose up -d
```

Cela démarre automatiquement :
- **PostgreSQL + PostGIS** sur le port `5432`
- **Redis** sur le port `6379`
- **Backend NestJS** sur le port `4000`
- **Frontend Next.js** sur le port `3000`

### 3. Initialiser la base de données

```bash
# Appliquer les migrations
docker exec keyora_backend npx prisma migrate deploy

# Insérer les données de test
docker exec keyora_backend npm run prisma:seed
```

### 4. Accéder à l'application

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:3000 |
| 🔌 API Backend | http://localhost:4000/api |
| 📚 Swagger / Docs | http://localhost:4000/api/docs |
| 🗄️ pgAdmin | Via votre client PostgreSQL |

---

## 👤 Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Super administrateur | superadmin@keyora.com | SuperAdmin123! |
| Administrateur | admin@keyora.com | Admin123! |
| Modérateur | moderateur@keyora.com | Modo123! |
| Propriétaire | proprietaire@keyora.com | Owner123! |
| Acheteur | acheteur@keyora.com | Buyer123! |

---

## 🛠️ Développement local (sans Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env    # Configurer DATABASE_URL pour localhost

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Insérer les données de test
npm run prisma:seed

# Démarrer en mode développement (hot-reload)
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install

# Créer le fichier .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local

# Démarrer
npm run dev
```

---

## 📁 Structure du projet

```
keyora/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── auth/               # JWT, inscription, vérification email
│   │   ├── listings/           # CRUD annonces + favoris
│   │   ├── moderation/         # Workflow PENDING → PUBLISHED/REJECTED
│   │   ├── search/             # PostGIS : recherche par polygone & rayon
│   │   ├── alerts/             # Zones d'alerte + EventEmitter
│   │   ├── media/              # Upload photos Cloudinary
│   │   ├── messages/           # Messagerie interne
│   │   ├── blog/               # CMS blog
│   │   ├── dashboard/          # Stats par rôle
│   │   └── common/             # Guards, decorators, mail
│   └── prisma/
│       ├── schema.prisma       # Modèle de données complet
│       └── seed.ts             # Données de démonstration
│
├── frontend/                   # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Accueil
│       │   ├── listing/        # Catalogue + détail
│       │   ├── sell/           # Publication d'annonce
│       │   ├── blog/           # Blog
│       │   ├── (auth)/         # Login, Register
│       │   └── (dashboard)/    # Dashboard, Modération, Alertes
│       ├── components/
│       │   ├── map/            # Carte Leaflet interactive
│       │   ├── listing/        # Cards, galerie
│       │   └── layout/         # Navbar, Footer, Providers
│       └── lib/
│           ├── api.ts          # Client axios + tous les endpoints
│           ├── store.ts        # Zustand (auth state)
│           └── utils.ts        # Formatters, helpers
│
├── .github/workflows/
│   └── ci-cd.yml               # Pipeline GitHub Actions
├── docker-compose.yml          # Tous les services
└── .env.example                # Template variables d'environnement
```

---

## 🗺️ Architecture technique

### Workflow des annonces

```
DRAFT ──[submit]──► PENDING ──[approve]──► PUBLISHED
                       │
                    [reject]──► REJECTED ──[submit]──► PENDING
```

### Recherche géographique (PostGIS)

**Par polygone** (dessiné sur la carte Leaflet) :
```sql
SELECT * FROM listings
WHERE status = 'PUBLISHED'
  AND ST_Within(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
    ST_GeomFromText('POLYGON((...))', 4326)
  )
```

**Par rayon** autour d'un point GPS :
```sql
SELECT *, ST_Distance(...)::float as distance_km
FROM listings
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
  $radius_meters
)
ORDER BY distance_km ASC
```

### Système d'alertes

1. Modérateur approuve une annonce → `listing.published` event émis
2. `AlertsService` écoute l'event via `@OnEvent('listing.published')`
3. Pour chaque zone active, vérifie `ST_Within(point, zone_polygon)`
4. Si match + filtres OK → email envoyé + `AlertMatch` enregistré

---

## 🔑 Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Clé secrète tokens | `super_secret_key` |
| `JWT_REFRESH_SECRET` | Clé refresh tokens | `another_secret` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | `mon_cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `abc123...` |
| `SMTP_HOST` | Serveur SMTP | `smtp.mailtrap.io` |
| `SMTP_USER` | Utilisateur SMTP | `user123` |
| `SMTP_PASS` | Mot de passe SMTP | `pass123` |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

---

## 🧪 Tests

```bash
# Tests unitaires backend
cd backend && npm test

# Tests E2E
cd backend && npm run test:e2e

# Swagger interactif
open http://localhost:4000/api/docs
```

---

## 🚀 Déploiement en production

### Secrets GitHub requis

Ajoutez ces secrets dans `Settings > Secrets and variables > Actions` :

| Secret | Description |
|---|---|
| `SSH_HOST` | IP du serveur de production |
| `SSH_USER` | Utilisateur SSH |
| `SSH_PRIVATE_KEY` | Clé SSH privée |
| `NEXT_PUBLIC_API_URL` | URL de l'API en prod |

### Sur le serveur de production

```bash
mkdir -p /opt/keyora
cd /opt/keyora
cp .env.example .env   # Configurer les variables de prod
# Le pipeline CI/CD gère le reste automatiquement
```

### Pipeline CI/CD

À chaque push sur `main` :
1. ✅ Tests backend + lint
2. ✅ Build frontend
3. 🐳 Build & push images Docker vers GitHub Container Registry
4. 🚀 Déploiement SSH sur le serveur de production

---

## 📚 Outils recommandés

| Outil | Usage |
|---|---|
| **VS Code** | IDE avec extensions Prisma, Tailwind, TypeScript |
| **Postman / Insomnia** | Tester les routes API |
| **pgAdmin 4** | Visualiser la base PostgreSQL + requêtes PostGIS |
| **Docker Desktop** | Gérer les conteneurs localement |
| **Mailtrap** | Intercepter les emails en développement |
| **Cloudinary** | Stockage des images (compte gratuit suffisant) |
| **Figma** | Maquettes UI/UX |

---

## 📄 Livrables du stage

- [x] Code source versionné (ce dépôt Git)
- [x] Application Docker déployable
- [x] Documentation API Swagger (`/api/docs`)
- [ ] Rapport de stage
- [ ] Application déployée (URL de production)

---

## 🤝 Contribuer

```bash
git checkout -b feature/ma-fonctionnalite
# ... développer ...
git commit -m "feat: description de la fonctionnalité"
git push origin feature/ma-fonctionnalite
# Créer une Pull Request vers develop
```

---

*Keyora — Stage Génie Logiciel & Web · 5 semaines*
