# 🔥 BeProudly

**Flaunt Your Fire** - Video dating with a devil's twist

BeProudly is a bold, energetic dating and social platform for the LGBTQ+ community, featuring video profiles, real-time matching, and secure messaging.

---

## ✨ Features

### Core Features
- 🔥 **Discover** - Swipe through profiles with Tinder-style interface
- 📹 **BlazeBold** - Video-based profiles for authentic connections
- 💬 **Messages** - Real-time chat with your matches
- 🎯 **Challenges** - Gamification and engagement features
- 📸 **GlowVault** - Media storage and gallery
- 😈 **Devil's Den** - Anonymous and private features
- 💜 **Pride Circles** - Community groups and connections
- 📍 **Nearby Users** - Geolocation-based discovery
- ⭐ **Premium** - Enhanced features and subscriptions

### Security Features
- 🔒 Enterprise-grade Row Level Security (RLS)
- 🛡️ Rate limiting (client + server-side)
- 📊 Comprehensive audit logging
- 🚨 Security event tracking
- ✅ Input validation & sanitization
- 🔐 JWT authentication
- 🚫 Block & report system

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Web App Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - The `.env` file is already configured with Supabase credentials
   - Update if needed:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

4. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web preview
   npm run web
   ```

---

## 🏗️ Tech Stack

### Frontend
- **Web**: React 18 + TypeScript + Vite
- **Mobile**: React Native + Expo
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Navigation**: React Navigation (mobile)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (serverless)
- **Real-time**: Supabase Realtime

### Security
- Row Level Security (RLS) policies
- Edge functions with JWT verification
- Rate limiting (database-level)
- Audit logging system
- Security event monitoring

---

## 📁 Project Structure

```
beproudly/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── lib/             # Supabase client & utilities
│   ├── pages/           # Main app pages/screens
│   ├── utils/           # Helper functions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── mobile/
│   ├── src/
│   │   ├── context/     # Mobile contexts
│   │   ├── lib/         # Mobile utilities
│   │   └── screens/     # Mobile screens
│   ├── App.tsx          # Mobile app entry
│   └── app.json         # Expo configuration
├── supabase/
│   ├── functions/       # Edge functions
│   │   ├── secure-message-handler/
│   │   ├── secure-like-handler/
│   │   ├── security-monitor/
│   │   └── report-handler/
│   └── migrations/      # Database migrations
├── SECURITY.md          # Security documentation
└── BACKEND_SECURITY.md  # Backend security details
```

---

## 🔐 Security

BeProudly implements enterprise-grade security:

- **Authentication**: Secure JWT-based auth with Supabase
- **Authorization**: Row Level Security on all tables
- **Rate Limiting**: 
  - Messages: 20/minute
  - Likes: 50/minute
  - Reports: 5/hour
- **Audit Logging**: All critical operations logged
- **Input Validation**: Client + server-side validation
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Token-based security

See [SECURITY.md](./SECURITY.md) for full details.

---

## 🗄️ Database Schema

### Main Tables
- `profiles` - User profiles with photos/videos
- `likes` - User likes/swipes
- `matches` - Mutual matches
- `messages` - Chat messages
- `blocks` - Blocked users
- `reports` - User reports

### Security Tables
- `audit_logs` - Operation audit trail
- `rate_limits` - Rate limiting tracking
- `security_events` - Security monitoring

---

## 🚀 Deployment

### Web App
```bash
npm run build
# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

### Mobile App
```bash
cd mobile
eas build --platform android
eas build --platform ios
```

---

## 📱 Mobile Features

- Native camera integration for video recording
- Geolocation for nearby users
- Push notifications (ready for implementation)
- Offline support
- Native navigation

---

## 🛠️ Development

### Available Scripts

**Web:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

**Mobile:**
- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser

---

## 📄 License

Private - All rights reserved

---

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

---

## 📞 Support

For issues or questions, contact the development team.

---

**Built with Bolt by the BeProudly team**
