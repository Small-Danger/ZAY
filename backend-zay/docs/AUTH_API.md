# Auth API — Vague B

Base : `http://localhost:4000/api`

Header protégé : `Authorization: Bearer <accessToken>`

---

## Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | public | Créer une cliente (`CUSTOMER`) |
| POST | `/auth/login` | public | Connexion → JWT |
| GET | `/auth/me` | JWT | Profil courant |

### Register

```json
{
  "email": "cliente@example.com",
  "password": "Motdepasse1",
  "firstName": "Amina",
  "lastName": "Ben"
}
```

### Login

```json
{
  "email": "admin@zay.local",
  "password": "Admin123!"
}
```

### Réponse login / register

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "role": "ADMIN"
  }
}
```

Rôles : `CUSTOMER` | `ADMIN`

---

## Protection catalogue

Les **écritures** catégories / produits / variantes exigent **JWT + rôle ADMIN**.  
Les **lectures** (GET) restent publiques.

---

## Auth API extras

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| PATCH | `/auth/me` | JWT | `firstName`, `lastName`, `phone` |
| POST | `/auth/change-password` | JWT | `currentPassword`, `newPassword` |


Créé au démarrage du backend si absent (variables `.env`) :

- `ADMIN_EMAIL=admin@zay.local`
- `ADMIN_PASSWORD=Admin123!`

---

## Test rapide (PowerShell)

```powershell
# Login admin
$res = Invoke-RestMethod http://localhost:4000/api/auth/login -Method POST -ContentType 'application/json' -Body '{"email":"admin@zay.local","password":"Admin123!"}'
$token = $res.accessToken

# Me
Invoke-RestMethod http://localhost:4000/api/auth/me -Headers @{ Authorization = "Bearer $token" }

# Création catégorie (admin)
$form = @{ name = 'TEST AUTH' }
Invoke-RestMethod http://localhost:4000/api/categories -Method POST -Headers @{ Authorization = "Bearer $token" } -Form $form
```
