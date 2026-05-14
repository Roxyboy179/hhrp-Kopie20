# 🔐 KOMPLETTER ADMIN-LOGIN FLOW - SCHRITT FÜR SCHRITT

## 📊 DATENFLUSS

```
Frontend (admin/page.js)
    ↓ POST /api/admin/login
    { mitarbeiterNummer: "MA-001", email: "roxyboy2474", password: "Joellading1202" }
    ↓
Backend (route.js → handleAdminLogin)
    ↓ 
supabase-helpers.js → getAdminAccountByCredentials()
    ↓
Supabase Query: 
    SELECT * FROM admin_accounts 
    WHERE mitarbeiter_nummer = 'MA-001' 
    AND is_active = true
    ↓
Filter: email ODER discord_username (case-insensitive)
    ↓
Passwort-Vergleich: account.password_hash === password
    ↓
Discord Member Check: getGuildMember(discord_user_id)
    ↓
Admin Role Check: getAdminRole(member.roles)
    ↓
JWT Token erstellen + Cookie setzen
    ↓
Response: { admin: {...} }
```

## 🎯 WAS MUSS IN DER DATENBANK STEHEN

**Tabelle:** `admin_accounts`

| Feld | Wert | Wichtig |
|------|------|---------|
| `mitarbeiter_nummer` | `MA-001` | EXAKT so! |
| `discord_user_id` | `1059408423726362695` | Deine Discord User ID |
| `discord_username` | `roxyboy2474` | **KLEINBUCHSTABEN!** |
| `email` | `roxyboy2474@icloud.com` | Gültige E-Mail |
| `password_hash` | `Joellading1202` | **KLARTEXT, KEIN HASH!** |
| `role_name` | `Projektinhaber` | Optional |
| `is_active` | `true` | **MUSS TRUE SEIN!** |

## ⚠️ HÄUFIGE FEHLER

### ❌ Fehler 1: Username Großschreibung
```sql
-- FALSCH:
discord_username: 'Roxyboy2474'  -- ❌

-- RICHTIG:
discord_username: 'roxyboy2474'  -- ✅ ALLES KLEIN!
```

### ❌ Fehler 2: Passwort ist noch bcrypt-Hash
```sql
-- FALSCH:
password_hash: '$2b$10$L4IAyFt...'  -- ❌ HASH!

-- RICHTIG:
password_hash: 'Joellading1202'  -- ✅ KLARTEXT!
```

### ❌ Fehler 3: Account ist inaktiv
```sql
-- FALSCH:
is_active: false  -- ❌

-- RICHTIG:
is_active: true   -- ✅
```

### ❌ Fehler 4: Mitarbeiter-Nummer stimmt nicht
```sql
-- FALSCH:
mitarbeiter_nummer: 'ma-001' oder 'MA001'  -- ❌

-- RICHTIG:
mitarbeiter_nummer: 'MA-001'  -- ✅ EXAKT so!
```

## 🔍 DEBUG-SCHRITTE

### 1. SQL in Supabase ausführen

Öffne Supabase SQL Editor und führe `/app/KOMPLETTES_FIX.sql` aus!

### 2. Erwartetes Ergebnis prüfen

Nach dem SQL solltest du sehen:

```
mitarbeiter_nummer: MA-001
discord_username: roxyboy2474
email: roxyboy2474@icloud.com
password_hash: Joellading1202
password_length: 14
is_active: true
```

### 3. Login testen

**URL:** https://account-security-43.preview.emergentagent.com/admin

**Eingeben:**
- Mitarbeiter-Nummer: `MA-001`
- E-Mail/Username: `roxyboy2474` (oder `Roxyboy2474` - beides funktioniert!)
- Passwort: `Joellading1202` (EXAKT so, case-sensitive!)

### 4. Browser-Konsole checken

Öffne Browser DevTools (F12) → Console

Erwartete Logs:
```
[DEBUG] Admin login attempt: { mitarbeiterNummer: 'MA-001', email: 'roxyboy2474' }
[DEBUG] Looking for account: { mitarbeiterNummer: 'MA-001', emailOrUsername: 'roxyboy2474' }
[DEBUG] Supabase query result: Found 1 accounts
[DEBUG] Found account: MA-001
[DEBUG] Comparing password...
[DEBUG] Password valid: true
[DEBUG] Checking Discord member...
[DEBUG] Login successful
```

### 5. Wenn immer noch Fehler

**Mach einen Screenshot von:**
1. Supabase SQL Editor Ergebnis (SELECT Statement)
2. Browser Console Logs
3. Login-Fehlermeldung

Und sende sie mir!

## 📁 DATEIEN

- `/app/KOMPLETTES_FIX.sql` - **DIESES SQL AUSFÜHREN!**
- `/app/supabase_tables.sql` - Tabellen-Schema
- `/app/lib/supabase-helpers.js` - Login-Logik Backend
- `/app/app/admin/page.js` - Login-Form Frontend

## ✅ CHECKLISTE

- [ ] SQL in Supabase ausgeführt
- [ ] SELECT Statement zeigt korrekten Account
- [ ] `password_hash` ist `Joellading1202` (NICHT `$2b$...`)
- [ ] `discord_username` ist `roxyboy2474` (KLEINBUCHSTABEN)
- [ ] `is_active` ist `true`
- [ ] Code zu GitHub gepusht (für Vercel Deploy)
- [ ] Login getestet auf Vercel URL

---

**Status:** Code ist fertig, SQL muss ausgeführt werden!
