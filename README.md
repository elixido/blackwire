# BLACKWIRE

Cyberpunk Jobboard fuer Shadowrun 6. Edition.

## Stack

- React
- TypeScript
- Vite
- React Router
- PWA via `vite-plugin-pwa`
- Lokaler Zustand per `localStorage`

## Start

```bash
npm install
npm run dev
```

## Demo Login

- Alias: `K1LL_SWITCH`
- Passwort: `blackwire`

## Enthalten

- Login und Registrierung
- Geschuetzter App-Bereich mit Desktop- und Mobile-Navigation
- Jobs-Board mit Filtern
- Job-Detailseite mit Bewerbungs- und Review-Flow
- Job erstellen und bearbeiten
- Runner-Uebersicht
- Runner erstellen, bearbeiten, loeschen und Bild-Upload
- Account-Seite mit unveraenderlichem Anzeigenamen
- Oeffentliche Profile
- Terminal-Aktivitaetsfeed
- PWA-Manifest fuer spaetere App-Installation

## Fuer die spaetere Online-Version

Folgende Punkte sind in dieser ersten Frontend-Version vorbereitet, aber noch nicht an ein echtes Backend angeschlossen:

- echte Registrierung mit Mail-Bestaetigung
- persistente Datenbank
- serverseitige Authentifizierung
- Push-Benachrichtigungen bei neuen Bewerbungen
- Datei-Storage fuer Runner-Bilder
- Deployment auf einem Hosting-Service
