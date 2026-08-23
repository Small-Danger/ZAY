# Orders API — Vague C

Base : `http://localhost:4000/api`  
Header : `Authorization: Bearer <token>`

---

## Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/orders` | JWT | Checkout (crée commande + décrémente stock) |
| GET | `/orders/me` | JWT | Mes commandes |
| GET | `/orders` | ADMIN | Liste + filtres `?status=&search=` |
| GET | `/orders/:idOrNumber` | JWT | Détail (propre commande ou admin) |
| PATCH | `/orders/:id/status` | ADMIN | Statut / tracking |

---

## Checkout body

```json
{
  "items": [
    { "productId": "<uuid>", "size": "M", "color": "Rose ZAY", "quantity": 1 }
  ],
  "shipping": {
    "firstName": "Amina",
    "lastName": "Ben",
    "phone": "0612345678",
    "addressLine": "12 Rue de la Paix",
    "city": "Paris",
    "postalCode": "75002",
    "country": "France"
  },
  "paymentMethod": "CARD"
}
```

`paymentMethod` : `CARD` | `KLARNA`

Prix recalculés côté serveur (prix produit BDD). Livraison = 0 pour l’instant.

---

## Statuts

`PENDING` · `PAID` · `PREPARING` · `SHIPPED` · `IN_TRANSIT` · `DELIVERED` · `CANCELLED` · `REFUNDED`

Numéro généré : `ZAY-xxxxx`

---

## Update statut (admin)

```json
{
  "status": "SHIPPED",
  "carrier": "Chronopost",
  "trackingCode": "XX123",
  "trackingUrl": "https://..."
}
```
