import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { spacing, colors, radius } from '../styles/tokens';
import { saveForm, loadForm } from '../services/storage';

export default function ConsentScreen({ navigation }: any) {
  const id='ortho_baseline_v1'; const [accepted,setAccepted]=useState(false);
  useEffect(()=>{ loadForm(id).then(s=> setAccepted(!!s?.consent)); },[]);
  const accept = async () => { const s=(await loadForm(id))||{}; s.consent=true; await saveForm(id,s); navigation.replace('Region'); };
  return (
    <ScrollView contentContainerStyle={{ padding:spacing(2), gap:spacing(2) }}>
      <Text style={{ fontSize:24, color:colors.text }}>Consentimento LGPD</Text>
      <View style={{ backgroundColor:colors.surface, padding:spacing(2), borderRadius:radius }}>
        <Text>Usaremos seus dados para guiar seu cuidado. Você pode revogar quando quiser. Seus dados serão protegidos e nunca vendidos.</Text>
      </View>
      <Pressable onPress={accept} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Aceito</Text>
      </Pressable>
      <Pressable onPress={()=>navigation.goBack()} style={{ padding:spacing(2) }}>
        <Text style={{ color:colors.textSecondary, textAlign:'center' }}>Não aceito</Text>
      </Pressable>
    </ScrollView>
  );
}


