import 'dotenv/config';
import process from 'process';

export default {
  expo: {
    name: 'react-native-chat',
    slug: 'react-native-chat',
    version: '1.0.0',
    orientation: 'portrait',
    icon: 'src/assets/icon.png',
    userInterfaceStyle: 'light',
    entryPoint: './src/App.js',
    splash: {
      image: 'src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: 'src/assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.ctere1.reactnativechat',
    },
    web: {
      favicon: 'src/assets/favicon.png',
    },
    newArchEnabled: true,
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
    },
  },
};
