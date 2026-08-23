# ZAY — Progression

> Règle : UI inchangée. Backend d’abord, intégration ensuite.

---

## Où on en est

| Champ | Valeur |
|-------|--------|
| **Phase** | Alignement dashboard admin |
| **Zone** | `/admin/settings` |
| **Design** | Inchangé (ajouts fonctionnels minimaux) |

---

## Statuts

| Vague | Statut |
|-------|--------|
| A–D | [x] |
| Adresses compte | [x] |
| Upload produits | [x] |
| Dashboard stats | [x] |
| Admin clientes | [x] |
| Inbox contact | [x] |
| Statut commandes admin | [x] |
| A.8 upload cat. UI | [x] |
| Admin settings | [x] |

---

## Test

1. `/admin/settings` — plus de 404
2. Profil admin → `PATCH /auth/me`
3. Mot de passe → `POST /auth/change-password`
4. Badge API « Connecté » si Nest up

---

## Journal

| Date | Fait | Suite |
|------|------|-------|
| 2026-08-04 | `/admin/settings` branché auth + health | Commandes (Exporter/Période) / Clientes détail |
