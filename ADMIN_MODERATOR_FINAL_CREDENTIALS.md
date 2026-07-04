# ADMIN & MODERATOR - VERIFIED ACCOUNTS READY

Both accounts are created by `npm run prisma:seed` and are verified in the database.

---

## LOGIN CREDENTIALS

### ADMIN ACCOUNT
```
Email:    admin@keyora.com
Password: Admin123!
Role:     ADMIN
Status:   VERIFIED
```

After login, the frontend redirects admins to `/dashboard/admin-super`.

---

### MODERATOR ACCOUNT
```
Email:    moderateur@keyora.com
Password: Modo123!
Role:     MODERATOR
Status:   VERIFIED
```

Moderators can access the moderation dashboard at `/dashboard/moderation`.

---

## HOW TO LOGIN

1. Open `http://localhost:3000/auth/login`
2. Enter one of the accounts above
3. Click `Se connecter`

---

## VERIFIED IN DATABASE

```
admin@keyora.com       | ADMIN      | verified
moderateur@keyora.com  | MODERATOR  | verified
```

No email confirmation is needed for these seeded accounts.
