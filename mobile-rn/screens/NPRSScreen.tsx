import { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import NPRSSlider from '../components/NPRSSlider';
import { saveForm, loadForm } from '../services/storage';
import { spacing, radius } from '../styles/tokens';

export default function NPRSScreen({ navigation }:any){
  const [v,setV]=useState(0); const id='ortho_baseline_v1';
  useEffect(()=>{ loadForm(id).then(s=> s?.pain_nprs!=null && setV(s.pain_nprs)); },[]);
  const next=async()=>{ const s=(await loadForm(id))||{}; s.pain_nprs=v; await saveForm(id,s); navigation.navigate('RedFlags'); };
  return (
    <View style={{ padding:spacing(2), gap:spacing(2) }}>
      <NPRSSlider label="Dor hoje (0 = nenhuma, 10 = pior possível)" value={v} onChange={setV}/>
      <Pressable onPress={next} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Continuar</Text>
      </Pressable>
    </View>
  );
}


