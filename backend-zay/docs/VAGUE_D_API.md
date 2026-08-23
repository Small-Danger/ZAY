# Vague D API — Promos / Contact / Wishlist

Base : `http://localhost:4000/api`

---

## Promos

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/promos` | ADMIN | Liste |
| POST | `/promos` | ADMIN | Créer |
| PATCH | `/promos/:id` | ADMIN | Modifier / toggle |
| DELETE | `/promos/:id` | ADMIN | Supprimer |
| POST | `/promos/validate` | public | Valider un code + calcul réduction |

### Create

```json
{
  "code": "ZAY15",
  "type": "PERCENTAGE",
  "value": 15,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "usageLimit": 500,
  "active": true
}
```

`type` : `PERCENTAGE` | `AMOUNT`

### Validate

```json
{ "code": "ZAY15", "subtotal": 189 }
```

→ `{ valid, code, type, value, discountAmount }`

Checkout accepte aussi `promoCode` optionnel sur `POST /orders`.

---

## Contact

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/contact` | public | Envoyer un message |
| GET | `/contact` | ADMIN | Inbox |
| PATCH | `/contact/:id/status` | ADMIN | `NEW` / `READ` / `ARCHIVED` |

### Create

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "subject": "ORDER_TRACKING",
  "message": "Où est mon colis ?"
}
```

`subject` : `ORDER_TRACKING` | `STYLING_ADVICE` | `RETURNS_EXCHANGES` | `MEDIA_PARTNERSHIP` | `OTHER`

---

## Wishlist

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/wishlist` | JWT | Produits favoris |
| POST | `/wishlist/toggle` | JWT | Ajouter / retirer `{ "productId" }` |
| DELETE | `/wishlist/:productId` | JWT | Retirer |

---

## Hors scope (pour plus tard)

- `/admin/settings` (pas de page UI)
- Newsletter (pas d’UI)
