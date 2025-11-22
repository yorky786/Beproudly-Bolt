# BeProudly Mobile App

A React Native mobile application for BeProudly - the video-first dating app for the LGBTQ+ community.

## Features

- **Video Dating**: Browse and create BlazeBold videos
- **Devil's Den**: Private chat rooms for deeper connections
- **Pride Circles**: Join communities that matter to you
- **Real-time Messaging**: Connect with matches instantly
- **Discover**: Swipe-style matching interface

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Database**: Supabase
- **State Management**: React Context API
- **Styling**: React Native StyleSheet

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android development)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Running the App

### Start the development server:
```bash
npm start
```

### Run on iOS Simulator:
```bash
npm run ios
```

### Run on Android Emulator:
```bash
npm run android
```

### Run on Web:
```bash
npm run web
```

## Building for Production

### iOS:
```bash
expo build:ios
```

### Android:
```bash
expo build:android
```

## Project Structure

```
mobile/
├── src/
│   ├── context/          # React Context providers
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   └── lib/              # Utilities and configurations
├── assets/               # Images, fonts, etc.
├── App.tsx               # Main app component
├── app.json              # Expo configuration
└── package.json
```

## Key Dependencies

- `@react-navigation/native` - Navigation
- `@supabase/supabase-js` - Database client
- `expo-camera` - Video recording
- `expo-av` - Video playback
- `expo-linear-gradient` - Gradient effects
- `@react-native-async-storage/async-storage` - Local storage

## Features in Development

- [ ] AR filters for BlazeBold videos
- [ ] AI-powered Vibe Check matching
- [ ] Virtual gift sending
- [ ] Blaze Trails (narrative video sequences)
- [ ] Push notifications
- [ ] In-app purchases for premium features

## License

Proprietary - All rights reserved
