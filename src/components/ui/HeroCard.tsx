import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from './Motion';

export function HeroCard({ title, meta, onPress, image = require('../../../assets/images/dog-welcome.png'), children }: {
  title: string; meta?: string; onPress?: () => void; image?: ImageSourcePropType; children?: ReactNode;
}) {
  const content = <>
    <Image source={image} style={styles.image} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{meta ? <Text style={styles.meta}>{meta}</Text> : null}{children}</View>
  </>;
  return onPress ? <MotionPressable accessibilityRole="button" accessibilityLabel={meta ? `${title}. ${meta}` : title} onPress={onPress} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>{content}</MotionPressable>
    : <View style={styles.hero}>{content}</View>;
}
const styles = StyleSheet.create({
  hero: { minHeight: tokens.size.heroHeight, borderRadius: tokens.radius.md, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: tokens.colors.primaryPressed },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  copy: { marginTop: tokens.size.buttonHeight * 2, padding: tokens.spacing.lg, gap: tokens.spacing.xs, backgroundColor: tokens.colors.overlay },
  title: { ...tokens.typography.heading, color: tokens.colors.onPrimary }, meta: { ...tokens.typography.caption, color: tokens.colors.onPrimary }, pressed: { opacity: 0.9 },
});
