# 🔧 KOMPLETTE ADMIN-LOGIN FIX - ANLEITUNG

## 🚨 Problem

Der Admin-Login funktioniert nicht, weil:
1. **Case-Sensitivity Problem**: Der Code vergleicht `Roxyboy2474` mit `roxyboy2474` → FAIL
2. **Passwort-Hash in DB**: In der Datenbank ist noch ein bcrypt-Hash statt Klartext

## ✅ Lösung

### Schritt 1: SQL in Supabase ausführen

**Öffne deinen Supabase SQL Editor und führe dieses SQL aus:**

```sql
-- Alten Account löschen
DELETE FROM admin_accounts WHERE mitarbeiter_nummer = 'MA-001';

-- Neuen Account mit Klartext-Passwort erstellen
INSERT INTO admin_accounts (
  discord_user_id,
  discord_username,
  mitarbeiter_nummer,
  email,
  password_hash,
  role_name,
  created_by,
  is_active
) VALUES (
  '1059408423726362695',
  'roxyboy2474',
  'MA-001',
  'roxyboy2474@icloud.com',
  'Joellading1202',
  'Projektinhaber',
  'system',
  true
);

-- Prüfen ob erfolgreich
SELECT 
  mitarbeiter_nummer,
  email,
  discord_username,
  password_hash,
  is_active,
  role_name
FROM admin_accounts
WHERE mitarbeiter_nummer = 'MA-001';
```

### Schritt 2: Erwartetes Ergebnis im SQL Editor

Nach dem SELECT solltest du sehen:

| mitarbeiter_nummer | email | discord_username | password_hash | is_active | role_name |
|---|---|---|---|---|---|
| MA-001 | roxyboy2474@icloud.com | roxyboy2474 | Joellading1202 | true | Projektinhaber |

**⚠️ WICHTIG:** `password_hash` muss `Joellading1202` sein (NICHT `$2b$10$...`)!

## 🔑 Login-Daten (Case-Insensitive)

Du kannst jetzt einloggen mit:

**Variante 1:**
- Mitarbeiter-Nummer: `MA-001`
- E-Mail/Username: `roxyboy2474` (klein geschrieben)
- Passwort: `Joellading1202`

**Variante 2:**
- Mitarbeiter-Nummer: `MA-001`
- E-Mail/Username: `Roxyboy2474` (mit Großbuchstaben - funktioniert jetzt auch!)
- Passwort: `Joellading1202`

**Variante 3:**
- Mitarbeiter-Nummer: `MA-001`
- E-Mail/Username: `roxyboy2474@icloud.com`
- Passwort: `Joellading1202`

## 📝 Was wurde im Code geändert?

### 1. Case-Insensitive Username/E-Mail Vergleich
**Datei:** `/app/lib/supabase-helpers.js` (Zeile 126-134)

**Vorher:**
```javascript
const account = accounts.find(a => 
  a.email === emailOrUsername || a.discord_username === emailOrUsername
);
```

**Nachher:**
```javascript
const emailOrUsernameLower = emailOrUsername.toLowerCase();
const account = accounts.find(a => 
  a.email?.toLowerCase() === emailOrUsernameLower || 
  a.discord_username?.toLowerCase() === emailOrUsernameLower
);
```

### 2. camelCase Mapping für Admin Accounts
**Datei:** `/app/app/api/[[...path]]/route.js` (Zeile 541)

**Vorher:**
```javascript
return NextResponse.json({ accounts });
```

**Nachher:**
```javascript
return NextResponse.json({ accounts: accounts.map(toCamelCase) });
```

## 🎯 Test-Checkliste

Nach dem SQL-Update teste folgendes:

- [ ] **Admin Login** auf https://realtime-sync-33.preview.emergentagent.com/admin
  - Mit `roxyboy2474` einloggen → sollte funktionieren
  - Mit `Roxyboy2474` einloggen → sollte auch funktionieren
  - Mit `roxyboy2474@icloud.com` einloggen → sollte auch funktionieren

- [ ] **Admin Dashboard** sollte laden ohne Fehler

- [ ] **Admin Accounts Seite** sollte Accounts korrekt anzeigen

- [ ] **Bewerbungen anzeigen** sollte funktionieren

## 🔒 Sicherheitshinweis

**Aktuell werden Passwörter im Klartext gespeichert!** Das ist nur für Testing!

Für Production solltest du bcrypt aktivieren:
1. Passwort mit bcrypt hashen
2. In Zeile 140 von `supabase-helpers.js` zurückändern zu: `await bcrypt.compare(password, account.password_hash)`

## 📄 Relevante Dateien

- `/app/update_password_plaintext.sql` - SQL zum Ausführen
- `/app/lib/supabase-helpers.js` - Login-Logik (case-insensitive)
- `/app/app/api/[[...path]]/route.js` - API Routes (camelCase mapping)

---

**Status:** ✅ Code gefixt, SQL muss noch ausgeführt werden
