# BLACKWIRE

Cyberpunk-Jobboard fuer Shadowrun 6. Edition.

## Stack

- React
- TypeScript
- Vite
- Express
- PostgreSQL via Supabase
- Supabase Storage
- PWA via `vite-plugin-pwa`

## Start

```bash
npm install
npm run dev
```

## Beta-Status

Die aktuelle Version ist fuer eine Beta-Phase vorbereitet:

- Registrierung schaltet Accounts sofort frei
- Mail-Verifizierung ist in der Beta deaktiviert
- Passwort-Reset ist in der Beta deaktiviert
- Daten liegen in Supabase
- Runner-Bilder laufen ueber Supabase Storage

## Produktion

```bash
npm run build
npm run start
```

## Demo Login

- Alias: `K1LL_SWITCH`
- Passwort: `blackwire`

## Enthalten

- Login und Registrierung
- Jobs-Board mit Filtern
- Job-Detailseite mit Bewerbungs- und Review-Flow
- Job erstellen und bearbeiten
- Runner-Uebersicht
- Runner erstellen, bearbeiten, loeschen und Bild-Upload
- Account-Seite mit unveraenderlichem Anzeigenamen
- Oeffentliche Profile
- Terminal-Aktivitaetsfeed
- PWA-Manifest fuer spaetere App-Installation

## Fuer den spaeteren Full Launch

Folgende Punkte koennen nach der Beta noch aktiviert oder erweitert werden:

- echte Mail-Bestaetigung
- Passwort-Reset per Mail
- Push-Benachrichtigungen bei neuen Bewerbungen
- Moderation und Meldesystem
- Impressum, Datenschutz und Terms
