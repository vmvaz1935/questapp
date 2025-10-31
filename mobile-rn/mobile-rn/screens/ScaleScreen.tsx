import { View, Text, Pressable, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { saveForm, loadForm } from '../services/storage';
import { spacing, radius, colors } from '../styles/tokens';

const SCALES:any = {
  LEFS: require('../scales/lefs.json'),
  ODI:  { license:'required' },
  DASH: { license:'required' },
  KOOS: { license:'required' },
  HOOS: { license:'required' }
};

export default function ScaleScreen({ route, navigation }:any){
  const id='ortho_baseline_v1';
  const [scaleId, setScaleId] = useState<string>('LEFS');
  const [answers,setAnswers]=useState<Record<string,number>>({});
  useEffect(()=>{ loadForm(id).then(s=>{
    const region = s?.region; if(!region){ navigation.replace('Region'); return; }
    const map:any = { 'Coluna lombar':'ODI', 'Joelho':'KOOS', 'Quadril':'HOOS', 'Ombro':'DASH', 'Cotovelo':'DASH', 'Punho/Mão':'DASH' };
    setScaleId(map[region] || 'LEFS');
  }); },[]);
  const data = SCALES[scaleId];
  const submit=async()=>{
    const s=(await loadForm(id))||{}; s[scaleId]=answers; await saveForm(id,s);
    navigation.navigate('Review');
  };
  if(!data) return null;
  const blocked = data.license==='required';
  return (
    <ScrollView contentContainerStyle={{ padding:spacing(2), gap:spacing(2) }}>
      <Text style={{ fontSize:20 }}>{scaleId}</Text>
      {blocked ? (
        <View style={{ padding:spacing(2), backgroundColor:'#FEF3C7', borderRadius:radius }}>
          <Text>Licença necessária para exibir conteúdo completo desta escala. Contate o administrador.</Text>
        </View>
      ) : (
        data.items.slice(0,10).map((it:any)=> (
          <View key={it.id} style={{ padding:spacing(2), backgroundColor:colors.surface, borderRadius:radius }}>
            <Text>{it.text}</Text>
          </View>
        ))
      )}
      <Pressable onPress={submit} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Continuar</Text>
      </Pressable>
    </ScrollView>
  );
}


