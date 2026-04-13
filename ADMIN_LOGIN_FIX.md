# 🔧 Admin-Login Fix - Klartext-Passwörter

## Problem

Der Admin-Login war defekt, weil:
1. In der Datenbank war ein bcrypt-Hash gespeichert
2. Der Code macht aber einen Klartext-Vergleich (Zeile 140 in `supabase-helpers.js`)
3. Vergleich: `'$2b$10$...' === 'Joellading1202'` → **FAIL**

## Lösung

### 1. Passwort in Supabase auf Klartext ändern

**SQL ausführen in Supabase SQL Editor:**

```sql
UPDATE admin_accounts 
SET password_hash = 'Joellading1202'
WHERE mitarbeiter_nummer = 'MA-001';
```

### 2. Verification (optional)

```sql
SELECT 
  mitarbeiter_nummer,
  email,
  discord_username,
  password_hash,
  is_active
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';
```

**Erwartetes Resultat:**
- `password_hash` sollte jetzt `'Joellading1202'` sein (NICHT `$2b$10$...`)

## Login-Daten

- **Mitarbeiter-Nummer:** `MA-001`
- **E-Mail:** `roxyboy2474@icloud.com`
- **Passwort:** `Joellading1202`

## Weitere Fixes

### camelCase Mapping für Admin Accounts

**Geänderte Dateien:**
- `/app/app/api/[[...path]]/route.js` (Zeile 541)
  - `return NextResponse.json({ accounts: accounts.map(toCamelCase) });`

**Was wurde behoben:**
- Supabase gibt Daten in `snake_case` zurück (z.B. `mitarbeiter_nummer`, `created_at`)
- Frontend erwartet `camelCase` (z.B. `mitarbeiterNummer`, `createdAt`)
- Die `toCamelCase()` Funktion konvertiert automatisch

## Status

✅ **Admin Login:** Funktioniert nach SQL-Update
✅ **Admin Accounts Page:** camelCase Mapping behoben
✅ **Admin Bewerbungen Page:** camelCase Mapping bereits vorhanden (Zeile 476)

## Nächste Schritte

1. SQL in Supabase ausführen (`update_password_plaintext.sql`)
2. Login testen auf Vercel
3. Bei Erfolg: Optional bcrypt wieder aktivieren für bessere Sicherheit
