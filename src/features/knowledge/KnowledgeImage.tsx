import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';
import { knowledgeImageLayout, type KnowledgeImageFocus } from './knowledge-image-layout';

export function KnowledgeImage({ source, focus }: { source: ImageSourcePropType; focus: KnowledgeImageFocus }) {
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const crop = frame
    ? knowledgeImageLayout(frame.width, frame.height, focus.aspectRatio, 1, focus)
    : null;

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setFrame((current) => current?.width === width && current.height === height ? current : { width, height });
  }

  const cropStyle = crop ? {
    position: 'absolute' as const,
    left: crop.left,
    top: crop.top,
    width: crop.width,
    height: crop.height,
  } : StyleSheet.absoluteFill;

  return <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
    <Image source={source} style={cropStyle} resizeMode={crop ? 'stretch' : 'cover'}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  </View>;
}
