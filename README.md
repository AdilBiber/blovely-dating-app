# BLovely - Dating App

Eine moderne Dating App mit Registrierung, Profilverwaltung, Suchfunktion und Chat.

## Features

- **Registrierung**: Mit Google OAuth oder eigener E-Mail Registrierung
- **Anmeldung**: Sichere JWT-basierte Authentifizierung
- **Profilverwaltung**: Komplettes CRUD für Benutzerprofile
- **Suchfunktion**: Filterbare Suche nach Alter, Geschlecht und Standort
- **Chatfunktion**: Echtzeit-Chat mit WebSocket

## Tech Stack

### Backend
- Node.js mit Express
- MongoDB mit Mongoose
- Passport.js für Authentifizierung
- Socket.io für Echtzeit-Chat
- JWT für Token-basierte Auth

### Frontend
- React 19
- Tailwind CSS für Styling
- Lucide React für Icons
- Axios für API Calls

## Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **MongoDB starten:**
   ```bash
   # Stelle sicher dass MongoDB läuft auf localhost:27017
   # Oder ändere die MONGODB_URI in .env
   ```

3. **Umgebungsvariablen konfigurieren:**
   ```bash
   # .env Datei bearbeiten
   MONGODB_URI=mongodb://localhost:27017/blovely
   JWT_SECRET=dein-geheimes-jwt-token
   GOOGLE_CLIENT_ID=deine-google-client-id
   GOOGLE_CLIENT_SECRET=dein-google-client-secret
   ```

4. **Google OAuth einrichten (optional):**
   - Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
   - Erstelle ein neues Projekt
   - Aktiviere Google+ API
   - Erstelle OAuth 2.0 Credentials
   - Füge Authorized redirect URI hinzu: `http://localhost:5000/auth/google/callback`

## Anwendung starten

### Entwicklung (beide Server gleichzeitig):
```bash
npm run dev
```

### Nur Backend:
```bash
npm run server
```

### Nur Frontend:
```bash
npm start
```

Die App ist dann verfügbar unter:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpunkte

### Authentifizierung
- `POST /api/register` - Benutzer registrieren
- `POST /api/login` - Benutzer anmelden
- `GET /auth/google` - Google OAuth starten
- `GET /auth/google/callback` - Google OAuth Callback

### Profile
- `GET /api/profile` - Eigenes Profil abrufen
- `PUT /api/profile` - Profil aktualisieren

### Suche
- `GET /api/search` - Benutzer suchen (mit Filtern)

### Nachrichten
- `GET /api/messages/:userId` - Chat-Nachrichten abrufen

## Datenbank Schema

### User
```javascript
{
  email: String,
  password: String, // gehasht mit bcrypt
  googleId: String,
  profile: {
    name: String,
    age: Number,
    gender: String,
    bio: String,
    interests: [String],
    location: String,
    photos: [String]
  }
}
```

### Message
```javascript
{
  sender: ObjectId,
  receiver: ObjectId,
  content: String,
  timestamp: Date
}
```

## Verwendung

1. **Registrieren**: Erstelle einen Account mit E-Mail oder Google
2. **Profil ausfüllen**: Füge Fotos, Bio und Interessen hinzu
3. **Suchen**: Nutze Filter um passende Profile zu finden
4. **Chatten**: Starte Gespräche mit interessanten Personen

## Deployment

Für Production deployment:
1. Setze alle Umgebungsvariablen
2. Nutze HTTPS für Google OAuth
3. Konfiguriere MongoDB Atlas oder andere Production DB
4. Baue das Frontend: `npm run build`

## Contributing

1. Fork das Projekt
2. Erstelle Feature Branch
3. Commit changes
4. Push zum Branch
5. Erstelle Pull Request

## License

MIT License
