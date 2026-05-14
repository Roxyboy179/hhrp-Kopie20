# HHRP – Supabase Email/Password Auth (zusätzlich zu Discord OAuth)

## user_problem_statement
Add a new section in the Profile tab named "Meine Einstellungen" (existing settings tab) where users
can create an account that is linked to their Discord account via email. On the login screen, add two
new options: "Nur Login" (Email + Password) and "Discord Login". Everything runs on Supabase Auth
except Discord auth. Password reset must work and email verification is mandatory.

## Implementation summary
- New SQL table `user_auth_links` (see `/app/SUPABASE_AUTH_MIGRATION.sql`)
- New backend helper `/app/lib/supabase-auth.js`
- New API endpoints in `/app/app/api/[[...path]]/route.js`:
  - GET  `/api/auth/supabase/status`
  - POST `/api/auth/supabase/signup`            (requires Discord login)
  - POST `/api/auth/supabase/login`
  - POST `/api/auth/supabase/request-password-reset`
  - POST `/api/auth/supabase/update-password`   (modes: accessToken OR currentPassword)
  - POST `/api/auth/supabase/resend-verification`
- New frontend: updated `/app/components/LoginModal.js` with choose-screen + Email/Password sub-flow
- New profile section `/app/components/profile/AccountSettingsSection.jsx`
- New pages: `/app/app/auth/reset-password/page.js`, `/app/app/auth/update-password/page.js`, `/app/app/auth/verified/page.js`

## Backend tests required
1. GET /api/auth/supabase/status without auth_token cookie → `{ hasAccount: false }` 200
2. POST /api/auth/supabase/signup without auth_token cookie → 401 "Discord-Login erforderlich"
3. POST /api/auth/supabase/signup with password < 8 → 400
4. POST /api/auth/supabase/login with no body → 400
5. POST /api/auth/supabase/login with invalid email/password → 401 INVALID_CREDENTIALS
6. POST /api/auth/supabase/request-password-reset with random email → 200 success message (generic)
7. POST /api/auth/supabase/update-password with no token/no body → 400
8. POST /api/auth/supabase/resend-verification without email → 400
9. Existing endpoints continue to work: GET /api/auth/me, GET /api/auth/discord, GET /api/stats etc.
10. Verify the route map in route.js is reachable (no 404 for the new routes)

## test_credentials
None required for backend tests (we will test endpoint reachability and validation only,
since the SQL migration must be run in the Supabase dashboard before full sign-up/login
can be tested end-to-end).

## Testing Protocol
- Backend agent must NEVER modify the API contracts above.
- Backend agent should use the public preview URL (NEXT_PUBLIC_BASE_URL).
- Frontend will only be tested when explicitly requested by user.

## Incorporate User Feedback
- User wants email = Discord email (locked field) — enforced server-side via cookie data
- User wants email confirmation mandatory — handled by Supabase
- User wants Discord membership check on Supabase login — implemented via getGuildMember

## Communication log
(empty — first run)
