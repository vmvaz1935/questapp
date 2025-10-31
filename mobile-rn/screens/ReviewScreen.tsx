import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { loadForm } from '../services/storage';
import { spacing, radius } from '../styles/tokens';

export default function ReviewScreen({ navigation }:any){
  const id='ortho_baseline_v1'; const [data,setData]=useState<any>({});
  useEffect(()=>{ loadForm(id).then(setData); },[]);
  return (
    <View style={{ padding:spacing(2), gap:spacing(2) }}>
      <Text style={{ fontSize:20 }}>Revisão</Text>
      <View style={{ backgroundColor:'#F3F4F6', padding:spacing(2), borderRadius:radius }}>
        <Text>Região: {data?.region ?? '-'}</Text>
        <Text>Dor (NPRS): {data?.pain_nprs ?? '-'}</Text>
        <Text>Red Flags: {Array.isArray(data?.red_flags) ? data.red_flags.join(', ') : '-'}</Text>
      </View>
      <Pressable onPress={()=>navigation.navigate('Region')} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Enviar</Text>
      </Pressable>
    </View>
  );
}


