import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/features/account/AuthProvider';
import { DEV_PREVIEW_ENABLED } from '../src/features/account/preview-policy';
import { theme } from '../src/theme/tokens';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { createStartupSplash } from '../src/startup/startup-splash';

const releaseSplash = createStartupSplash(SplashScreen);
try { SplashScreen.setOptions({ duration: 0, fade: false }); } catch { /* Startup must not depend on animation support. */ }

export default function RootLayout() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  const app = (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: reduceMotion ? 'none' : 'fade' }} />
    </>
  );
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={releaseSplash}>
        {DEV_PREVIEW_ENABLED ? app : <AuthProvider>{app}</AuthProvider>}
      </View>
    </SafeAreaProvider>
  );
}
