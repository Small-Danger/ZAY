# API Catalogue ZAY — référence

Base API : `http://localhost:4000/api`  
Fichiers uploadés : `http://localhost:4000/uploads/...` (hors `/api`)

---

## Catégories — images par **upload** (pas par lien)

Les endpoints create/update acceptent `multipart/form-data` :

| Champ form | Type | Rôle |
|------------|------|------|
| `name` | texte | Nom catégorie / sous-catégorie |
| `image` | **fichier** | JPEG / PNG / WEBP / GIF — max 5 Mo |

Le serveur enregistre le fichier dans `uploads/categories/` (ou `subcategories/`) et stocke en BDD une URL publique du type :

`/uploads/categories/<uuid>.png`

Accessible ensuite : `http://localhost:4000/uploads/categories/<uuid>.png`

### Routes

| Méthode | Route | Content-Type |
|---------|-------|--------------|
| GET | `/categories` | — |
| GET | `/categories/:id` | — |
| POST | `/categories` | **multipart** (`name` + `image?`) |
| PATCH | `/categories/:id` | **multipart** (`name?` + `image?`) |
| DELETE | `/categories/:id` | — |
| POST | `/categories/:id/subcategories` | **multipart** |
| PATCH | `/categories/:categoryId/subcategories/:subId` | **multipart** |
| DELETE | `/categories/:categoryId/subcategories/:subId` | — |

Exemple curl :

```bash
curl -X POST http://localhost:4000/api/categories \
  -F "name=ROBES" \
  -F "image=@./robes.png"
```

```bash
curl -X PATCH http://localhost:4000/api/categories/<id> \
  -F "image=@./nouvelle-image.jpg"
```

---

## Produits & variantes

Inchangé — voir section précédente. Variantes : `colorName` + `colorHex` pour les pastilles.

| Méthode | Route |
|---------|-------|
| GET/POST | `/products` |
| GET/PATCH/DELETE | `/products/:id` |
| POST/PATCH/DELETE | `/products/:id/variants/...` |

---

## Health

| GET | `/health` |
