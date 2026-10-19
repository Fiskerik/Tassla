import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from './Motion';

export type HeroCardVariant = 'overlay' | 'training-image-top';

export function HeroCard({ title, meta, onPress, image = require('../../../assets/images/dog-welcome.png'), children, variant = 'overlay', selected = false, fill = false }: {
  title: string; meta?: string; onPress?: () => void; image?: ImageSourcePropType; children?: ReactNode; variant?: HeroCardVariant; selected?: boolean; fill?: boolean;
}) {
  const content = variant === 'training-image-top' ? <>
    <Image source={image} style={styles.trainingImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <View style={[styles.trainingCopy, fill && styles.trainingCopyFill]}><Text style={styles.trainingTitle} numberOfLines={3}>{title}</Text>{meta ? <Text style={styles.trainingMeta}>{meta}</Text> : null}{children}</View>
  </> : <>
    <Image source={image} style={styles.image} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{meta ? <Text style={styles.meta}>{meta}</Text> : null}{children}</View>
  </>;
  const cardStyle = [styles.hero, variant === 'training-image-top' && styles.trainingHero, variant === 'training-image-top' && fill && styles.trainingHeroFill, variant === 'training-image-top' && selected && styles.trainingSelected];
  return onPress ? <MotionPressable accessibilityRole="button" accessibilityLabel={meta ? `${title}. ${meta}` : title} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>{content}</MotionPressable>
    : <View accessibilityState={{ selected }} style={cardStyle}>{content}</View>;
}
const styles = StyleSheet.create({
  hero: { minHeight: tokens.size.heroHeight, borderRadius: tokens.radius.md, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: tokens.colors.primaryPressed },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  copy: { marginTop: tokens.size.buttonHeight * 2, padding: tokens.spacing.lg, gap: tokens.spacing.xs, backgroundColor: tokens.colors.overlay },
  title: { ...tokens.typography.heading, color: tokens.colors.onPrimary }, meta: { ...tokens.typography.caption, color: tokens.colors.onPrimary }, pressed: { opacity: 0.9 },
  trainingHero: { justifyContent: 'flex-start', backgroundColor: tokens.colors.training.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  trainingHeroFill: { flex: 1, minHeight: 0 },
  trainingSelected: { borderColor: tokens.colors.training.accent, borderWidth: 2 },
  trainingImage: { width: '100%', height: tokens.size.trainingImage },
  trainingCopy: { padding: tokens.spacing.md, gap: tokens.spacing.xs },
  trainingCopyFill: { flex: 1, minHeight: 0 },
  trainingTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  trainingMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
