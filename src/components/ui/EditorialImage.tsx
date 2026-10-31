import { Image as ExpoImage } from 'expo-image';
import type { ImageProps, ImageSourcePropType } from 'react-native';

type EditorialImageProps = Pick<ImageProps, 'style' | 'accessible' | 'accessibilityLabel' | 'accessibilityElementsHidden' | 'importantForAccessibility' | 'testID'> & {
  source: ImageSourcePropType | string;
  resizeMode?: 'cover' | 'contain' | 'stretch';
};

/** Bundled decorative photos; keep the caller's frame and focal crop. */
export function EditorialImage({ source, resizeMode = 'cover', accessible = false, accessibilityLabel = '',
  accessibilityElementsHidden = !accessible, importantForAccessibility = accessible ? 'auto' : 'no-hide-descendants', ...props }: EditorialImageProps) {
  const identity = typeof source === 'number' || typeof source === 'string' ? String(source)
    : JSON.stringify(source);
  return <ExpoImage {...props} key={identity} source={source} recyclingKey={identity}
    contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode} cachePolicy="memory-disk" transition={0}
    accessible={accessible} accessibilityLabel={accessibilityLabel} accessibilityElementsHidden={accessibilityElementsHidden} importantForAccessibility={importantForAccessibility} />;
}
