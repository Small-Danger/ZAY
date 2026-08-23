# Backend ZAY — Architecture

## Principe

```
frontend-zay (UI figée)  ──HTTP──►  backend-zay (/api)  ──►  PostgreSQL
```

Le front ne contient plus la logique métier à terme.
Chaque module Nest correspond à un domaine métier.

## Lancement local

À la racine du repo : `docker compose up -d`

Les 3 services tournent dans Docker (Postgres, API Nest, frontend).  
Ne pas lancer `npm run start:dev` sur l’hôte en parallèle : le port `:4000` serait pris deux fois.

Site : http://localhost:9002 — API : http://localhost:4000/api/health

## Arborescence `src/`

```
src/
├── main.ts
├── app.module.ts
├── config/
├── common/
├── prisma/
└── modules/
    ├── health/
    ├── auth/
    ├── categories/
    ├── products/
    ├── orders/
    ├── promos/              # Vague D
    ├── contact/             # Vague D
    └── wishlist/            # Vague D
```

## Docs API

- `docs/CATALOGUE_API.md`
- `docs/AUTH_API.md`
- `docs/ORDERS_API.md`
- `docs/VAGUE_D_API.md`

## Règles

1. Un dossier = un domaine métier clair.
2. Pas de logique métier dans les controllers.
3. Tout input externe passe par un DTO validé.
4. Migrations Prisma dans `prisma/migrations/`.
5. Frontend branché après validation API.
6. Écritures catalogue = JWT + rôle `ADMIN` (`@AdminOnly()`).
