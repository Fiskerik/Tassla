import { Platform } from 'react-native';
import { selectionAsync } from 'expo-haptics';

export async function playConfirmationHaptic(canPlay: () => boolean): Promise<boolean> {
  try {
    if ((Platform.OS !== 'ios' && Platform.OS !== 'android') || !canPlay()) return false;
    await selectionAsync();
    return true;
  } catch {
    return false;
  }
}
