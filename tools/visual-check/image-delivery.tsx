import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollView, Text, View } from 'react-native';
import { EditorialImage } from '../../src/components/ui/EditorialImage';
import { KnowledgeImage } from '../../src/features/knowledge/KnowledgeImage';
import { checklistPhaseVisualFor } from '../../src/features/knowledge/checklist-phase-visuals';

function ImageDeliveryProbe() {
  const [changed, setChanged] = useState(false);
  const first = require('../../assets/images/dog-welcome.jpg');
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 16, backgroundColor: '#F7F1E7' }}>
    <Text accessibilityRole="header">Bildleverans</Text>
    <button onClick={() => setChanged(true)}>Byt bild</button>
    <Text>{changed ? 'Nästa motiv' : 'Första motiv'}</Text>
    <View testID="source-switch" style={{ height: 112, overflow: 'hidden', backgroundColor: '#E7EDE6' }}>
      <EditorialImage source={changed ? { uri: '/delayed.jpg' } : first} style={{ width: '100%', height: '100%' }} />
    </View>
    {(['before_homecoming', 'first_days', '8_12_weeks', '3_6_months', '6_12_months', 'over_1_year'] as const).map((phase) => {
      const visual = checklistPhaseVisualFor(phase);
      return <View key={phase} style={{ gap: 4 }}>
        <Text>{phase}</Text>
        <View testID={`phase-${phase}`} style={{ height: 88, overflow: 'hidden', borderRadius: 16 }}>
          <KnowledgeImage source={visual.source} focus={visual.focus} />
        </View>
      </View>;
    })}
    <View testID="portrait" style={{ width: 72, height: 72, borderRadius: 36, overflow: 'hidden' }}>
      <EditorialImage source={require('../../assets/images/home-dog-portrait-placeholder.jpg')} style={{ width: '100%', height: '100%', transform: [{ scale: 1.08 }] }} />
    </View>
  </ScrollView>;
}

createRoot(document.getElementById('root')!).render(<ImageDeliveryProbe />);
