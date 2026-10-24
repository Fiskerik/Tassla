import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { tokens } from '../../theme/tokens';
import { AppBar } from './AppBar';
import { ActionMenu } from './ActionMenu';
import { BottomNav, type BottomNavDestination } from './BottomNav';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Card } from './Card';
import { CheckboxCard } from './CheckboxCard';
import { ChecklistItem } from './ChecklistItem';
import { DailyActivityItem } from './DailyActivityItem';
import { DestinationTile } from './DestinationTile';
import { Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { Field } from './Field';
import { HeroCard } from './HeroCard';
import { IconChip, type IconCategory } from './IconChip';
import { ListRow } from './ListRow';
import { Progress } from './Progress';
import { QuickLogTile } from './QuickLogTile';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { Skeleton } from './Skeleton';
import { Tabs } from './Tabs';
import { Toast } from './Toast';

const categories: IconCategory[] = ['pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water', 'training', 'vaccination', 'deworming', 'veterinary'];

export function ComponentGalleryScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Översikt');
  const [activeTrainingTab, setActiveTrainingTab] = useState('Rekommenderat');
  const [checked, setChecked] = useState(false);
  const [activityChecked, setActivityChecked] = useState(false);
  const [field, setField] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeNav, setActiveNav] = useState<BottomNavDestination>('home');
  return <View style={styles.page}>
    <AppBar mode="Back" title="Komponentgalleri" onAction={onBack} />
    <Text style={styles.note}>Håll in en knapp för att se tryckläget.</Text>
    <SectionHeader title="Knappar" />
    {(['primary', 'secondary', 'tertiary', 'icon', 'destructive'] as const).map((variant) => <View key={variant} style={styles.group}>
      <Text style={styles.caption}>{variant}</Text>
      <Button variant={variant} label={variant === 'destructive' ? 'Radera' : 'Spara'} accessibilityLabel={variant === 'icon' ? 'Fler val' : variant === 'destructive' ? 'Radera' : 'Spara'} iconName="ellipsis-horizontal" onPress={() => undefined} />
      <Button variant={variant} label="Avstängd" accessibilityLabel="Avstängd" onPress={() => undefined} disabled />
      <Button variant={variant} label="Laddar" accessibilityLabel="Laddar" onPress={() => undefined} loading />
      <Button variant={variant} label="Tryckt" accessibilityLabel="Tryckt" onPress={() => undefined} state="pressed" />
    </View>)}
    <SectionHeader title="Appbar och flikar" />
    <AppBar mode="Home" title="Tassla" />
    <AppBar mode="Close" title="Tassla-pass" onAction={() => undefined} />
    <Tabs items={['Översikt', 'Vaccinationer', 'Veterinär', 'Vikt']} active={activeTab} onChange={setActiveTab} />
    <Tabs items={['Rekommenderat', 'Alla övningar', 'Mina']} active={activeTrainingTab} onChange={setActiveTrainingTab} variant="rev02-segmented" />
    <SectionHeader title="Rader och kort" />
    <ListRow title="Promenad" meta="Idag · 20 min" category="walk" onPress={() => undefined} />
    <ListRow title="Träningssteg" meta="Genomfört" category="training" complete onPress={() => undefined} />
    <ListRow title="Vila" category="sleep" disabled onPress={() => undefined} />
    <Card accessibilityLabel="Innehållskort"><Text style={styles.body}>Ett lugnt kort med innehållsstyrd höjd.</Text></Card>
    <Card variant="home" accessibilityLabel="Varmt Hem-kort"><Text style={styles.body}>Opt-in yta för Hem enligt rev02.</Text></Card>
    <Card onPress={() => undefined} accessibilityLabel="Öppna kort"><Text style={styles.body}>Tryckbart kort</Text></Card>
    <Card selected accessibilityLabel="Valt kort"><Text style={styles.body}>Valt kort</Text></Card>
    <HeroCard title="Veckans fokus" meta="3 av 5 genomförda" onPress={() => undefined} />
    <View style={styles.trainingTiles}>
      <View style={styles.trainingCard}><HeroCard variant="training-image-top" image={require('../../../assets/images/puppy-training.png')} title="Trygg vardagsstart" meta="3 övningar" selected onPress={() => undefined} /></View>
      <View style={styles.trainingCard}><HeroCard variant="training-image-top" image={require('../../../assets/images/puppy-training.png')} title="Kontakt i vardagen" meta="2 övningar" onPress={() => undefined} /></View>
    </View>
    <SectionHeader title="Hemaktiviteter och destinationer" />
    <DailyActivityItem label="Öva lugn hantering" detail="Tassar och öron" category="training" completed={activityChecked}
      onToggle={() => setActivityChecked(!activityChecked)} onOpen={() => undefined} />
    <DailyActivityItem variant="home" kind="training" label="Miljöträning – nya ljud" completed={false} onOpen={() => undefined} />
    <View style={styles.destinationTiles}>
      <DestinationTile destination="log" onPress={() => undefined} />
      <DestinationTile destination="training" onPress={() => undefined} />
      <DestinationTile destination="knowledge" onPress={() => undefined} />
    </View>
    <View style={styles.destinationTiles}>
      <DestinationTile destination="log" compact variant="home" onPress={() => undefined} />
      <DestinationTile destination="training" compact variant="home" onPress={() => undefined} />
      <DestinationTile destination="knowledge" compact variant="home" onPress={() => undefined} />
    </View>
    <SectionHeader title="Snabblogg och ikoner" />
    <View style={styles.tiles}><QuickLogTile label="Kiss" category="pee" onPress={() => undefined} /><QuickLogTile label="Bajs" category="poop" onPress={() => undefined} /></View>
    <View style={styles.tiles}><QuickLogTile label="Mat" category="food" onPress={() => undefined} /><QuickLogTile label="Sömn" category="sleep" onPress={() => undefined} disabled /></View>
    <View style={styles.tiles}><QuickLogTile variant="rev02-log" compact label="Kiss" category="pee" onPress={() => undefined} /><QuickLogTile variant="rev02-log" compact label="Bajs" category="poop" onPress={() => undefined} /></View>
    <View style={styles.tiles}><QuickLogTile variant="rev02-log" compact label="Mat" category="food" onPress={() => undefined} /><QuickLogTile variant="rev02-log" compact label="Sömn" category="sleep" onPress={() => undefined} disabled /></View>
    <View style={styles.chips}>{categories.map((category) => <IconChip key={category} category={category} />)}</View>
    <View style={styles.chips}>{categories.map((category) => <IconChip key={category} category={category} size="large" />)}</View>
    <View style={styles.chips}>{categories.map((category) => <IconChip key={`log-${category}`} category={category} variant="rev02-log" />)}</View>
    <SectionHeader title="Tidslinje: standard och Logg" />
    <ListRow title="Promenad" time="09:15" meta="20 minuter" category="walk" onPress={() => undefined} />
    <View><ListRow variant="log-timeline" showDivider title="Promenad" time="09:15" detail="20 minuter" category="walk" onPress={() => undefined} /><ListRow variant="log-timeline" title="Mat" time="10:05" detail="Åt allt" category="food" onPress={() => undefined} /></View>
    <SectionHeader title="Checklista och framsteg" />
    <ChecklistItem label="Kom när du ropar" checked={checked} onPress={() => setChecked(!checked)} />
    <ChecklistItem label="Vila på sin filt" checked disabled onPress={() => undefined} />
    <Progress value={0} label="0 av 5 genomförda" />
    <Progress value={60} label="3 av 5 genomförda" />
    <Progress value={100} label="5 av 5 genomförda" />
    <SectionHeader title="Återkoppling och status" />
    <Toast visible tone="success" message="Loggat · Sparat" confirmed onUndo={() => undefined} />
    <Toast visible tone="error" message="Kunde inte spara" onRetry={() => undefined} />
    <Toast visible tone="neutral" message="Påminnelsen är avstängd" />
    <Toast visible tone="uncertain" onRetry={() => undefined} />
    <StatusBadge status="saving" /><StatusBadge status="offline" /><StatusBadge status="error" />
    <EmptyState onAction={() => undefined} />
    <SectionHeader title="Formulär och val" />
    <Field label="Hundens namn" value={field} onChangeText={setField} help="Skriv hundens namn" placeholder="Till exempel Luna" />
    <Field label="Datum" value="2026-10-07" onChangeText={() => undefined} kind="date" />
    <Field label="Tid" value="12:05" onChangeText={() => undefined} kind="time" />
    <Field label="Anteckning" value="" onChangeText={() => undefined} kind="multiline" />
    <Field label="Datum" value="07/32" onChangeText={() => undefined} kind="date" error="Kontrollera datumet" />
    <CheckboxCard label="Visa påminnelse" checked={checked} onChange={setChecked} />
    <CheckboxCard label="Påminnelse avstängd" checked={false} onChange={() => undefined} disabled />
    <Field label="Fokuserat fält" value="Luna" onChangeText={() => undefined} state="focus" />
    <Field label="Inaktiverat fält" value="Luna" onChangeText={() => undefined} state="disabled" />
    <SectionHeader title="Åtgärder och laddning" />
    <ActionMenu visible={showMenu} onOpen={() => setShowMenu(true)} onClose={() => setShowMenu(false)} onEdit={() => undefined} onDelete={() => undefined} />
    <Skeleton shape="line" lines={2} /><Skeleton shape="circle" /><Skeleton shape="card" /><Skeleton shape="row" />
    <BottomNav active={activeNav} onChange={setActiveNav} />
    <SectionHeader title="Dialog och panel" />
    <Button variant="secondary" label="Visa dialog" accessibilityLabel="Visa dialog" onPress={() => setShowDialog(true)} />
    <Button variant="secondary" label="Visa panel" accessibilityLabel="Visa panel" onPress={() => setShowSheet(true)} />
    <Dialog visible={showDialog} title="Radera händelsen?" onRequestClose={() => setShowDialog(false)} onConfirm={() => setShowDialog(false)}><Text style={styles.body}>Det går inte att ångra.</Text></Dialog>
    <BottomSheet visible={showSheet} title="Tassla-pass" onRequestClose={() => setShowSheet(false)} onPrimaryAction={() => setShowSheet(false)}><Text style={styles.body}>En kort överblick för veterinärbesöket. Dela som PDF.</Text></BottomSheet>
  </View>;
}

const styles = StyleSheet.create({ page: { alignSelf: 'stretch', padding: tokens.layout.pageInset, gap: tokens.spacing.md, backgroundColor: tokens.colors.background }, note: { ...tokens.typography.caption, color: tokens.colors.textSecondary }, group: { alignSelf: 'stretch', gap: tokens.spacing.sm }, caption: { ...tokens.typography.caption, color: tokens.colors.textSecondary }, body: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 }, tiles: { alignSelf: 'stretch', flexDirection: 'row', gap: tokens.spacing.md }, destinationTiles: { alignSelf: 'stretch', flexDirection: 'row', gap: tokens.spacing.sm }, trainingTiles: { alignSelf: 'stretch', flexDirection: 'row', gap: tokens.spacing.md }, trainingCard: { flexBasis: '47%', flexShrink: 1 }, chips: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm } });
