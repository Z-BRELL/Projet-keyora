-- Admin and Moderator accounts for testing.
-- Passwords are hashed with bcrypt (cost 10).
-- Admin password: Admin123!
-- Moderator password: Modo123!

DELETE FROM "User" WHERE email IN (
  'admin@test.com',
  'moderator@test.com',
  'admin@keyora.dev',
  'moderator@keyora.dev',
  'moderator@keyora.com'
);

INSERT INTO "User" (
  id,
  email,
  "fullName",
  phone,
  "passwordHash",
  role,
  "isVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  'seed-admin-keyora',
  'admin@keyora.com',
  'Admin Keyora',
  '+237670123456',
  '$2a$10$DBDBX.d0jPIo4fZvWsJKQ.18ERXB2CoaPiuHr07ggZeY4Z70s2IY.',
  'ADMIN',
  true,
  NOW(),
  NOW()
),
(
  'seed-moderateur-keyora',
  'moderateur@keyora.com',
  'Moderateur Keyora',
  '+237672345678',
  '$2a$10$0T3szvEXgKVs3W2sywqCgu4srjOkdRyjxDQttar1eTf7BKs8kkpUy',
  'MODERATOR',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  phone = EXCLUDED.phone,
  "passwordHash" = EXCLUDED."passwordHash",
  role = EXCLUDED.role,
  "isVerified" = true,
  "updatedAt" = NOW();

SELECT email, role, "isVerified" FROM "User" WHERE email IN ('admin@keyora.com', 'moderateur@keyora.com');
