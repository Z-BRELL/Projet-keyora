UPDATE "User" SET "isVerified" = true WHERE email IN ('admin@keyora.com', 'moderateur@keyora.com');
SELECT email, role, "isVerified" FROM "User" WHERE email IN ('admin@keyora.com', 'moderateur@keyora.com');
