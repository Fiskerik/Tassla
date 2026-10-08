import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appConfig = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
const serviceSource = await readFile(new URL('../src/notifications/notification-service.ts', import.meta.url), 'utf8');
const settingsSource = await readFile(new URL('../src/features/notifications/NotificationSettingsScreen.tsx', import.meta.url), 'utf8');

test('Expo local notification plugin uses the runtime reminder channel and has no remote background capability', () => {
  const plugin = appConfig.plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-notifications');
  assert.ok(plugin, 'expo-notifications config plugin must be applied during prebuild');
  assert.equal(plugin[1].defaultChannel, 'tassla-reminders-v1');
  assert.notEqual(plugin[1].enableBackgroundRemoteNotifications, true);
});

test('local reminder permission is requested only from the explicit settings action and does not register push tokens', () => {
  assert.match(settingsSource, /onPress=\{\(\) => \{ void requestPermission\(\); \}\}/);
  assert.match(serviceSource, /async requestPermission\(context: ReminderContext\)/);
  assert.doesNotMatch(serviceSource, /getExpoPushTokenAsync|registerForPushNotificationsAsync/);
  assert.doesNotMatch(serviceSource, /EXPO_PUBLIC_EAS_PROJECT_ID|projectId/);
});

test('iOS bundle identifier matches Codemagic signing configuration', async () => {
  const codemagic = await readFile(new URL('../codemagic.yaml', import.meta.url), 'utf8');
  assert.equal(appConfig.ios.bundleIdentifier, 'com.erimaliab.tassla');
  assert.match(codemagic, /bundle_identifier:\s*com\.erimaliab\.tassla/);
});
