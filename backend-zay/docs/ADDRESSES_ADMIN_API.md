# Adresses + Admin API

Base : `http://localhost:4000/api`

---

## Adresses (JWT)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/addresses` | Liste des adresses du user |
| POST | `/addresses` | Créer |
| PATCH | `/addresses/:id` | Modifier |
| PATCH | `/addresses/:id/default` | Définir comme principale |
| DELETE | `/addresses/:id` | Supprimer |

```json
{
  "name": "Domicile",
  "street": "12 Rue de la Paix",
  "city": "Paris",
  "zip": "75002",
  "country": "France",
  "isDefault": true
}
```

---

## Admin

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/admin/stats` | ADMIN | KPIs dashboard |
| GET | `/admin/users?search=` | ADMIN | Liste clientes |
| GET | `/admin/users/:id` | ADMIN | Détail + dernières commandes |

### Stats

```json
{
  "ordersToday": 2,
  "ordersTodayDeltaPct": 12,
  "revenueToday": 384.5,
  "revenueTodayDeltaPct": 8.2,
  "newUsersToday": 1,
  "newUsersTodayDeltaPct": -3,
  "lowStockCount": 4,
  "revenueSeries": [{ "day": "03/08", "ca": 120 }],
  "recentOrders": []
}
```

---

## Produits — upload image

`POST /products` et `PATCH /products/:id` acceptent `multipart/form-data` avec fichier `image` (ou champ texte `image` URL/path).
`variants` peut être une string JSON en multipart.
