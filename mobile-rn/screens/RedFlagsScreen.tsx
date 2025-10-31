import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { saveForm, loadForm } from '../services/storage';
import { spacing, radius, colors } from '../styles/tokens';

const FLAGS = [
  'Perda de controle urinário/intestino',
  'Fraqueza acentuada recente',
  'Febre com dor nas costas',
  'Histórico de câncer',
  'Trauma recente grave'
];

export default function RedFlagsScreen({ navigation }:any){
  const id='ortho_baseline_v1'; const [sel,setSel]=useState<string[]>([]);
  useEffect(()=>{ loadForm(id).then(s=> s?.red_flags && setSel(s.red_flags)); },[]);
  const toggle=(f:string)=> setSel(p=> p.includes(f)? p.filter(x=>x!==f): [...p,f]);
  const next=async()=>{
    const s=(await loadForm(id))||{}; s.red_flags=sel; await saveForm(id,s);
    if(sel.length>0) navigation.navigate('Info', { style:'critical', text: 'Recomendamos avaliação clínica imediata. Procure atendimento de urgência.' });
    else navigation.navigate('Scale');
  };
  return (
    <View style={{ padding:spacing(2), gap:spacing(2) }}>
      <Text style={{ fontSize:20 }}>Algum destes sinais de alerta?</Text>
      {FLAGS.map(f=> (
        <Pressable key={f} onPress={()=>toggle(f)}
          style={{ padding:spacing(2), borderRadius:radius, borderWidth:1, borderColor:'#E5E7EB', backgroundColor: sel.includes(f)? colors.primary : colors.surface }}>
          <Text style={{ color: sel.includes(f)? '#fff' : colors.text }}>{f}</Text>
        </Pressable>
      ))}
      <Pressable onPress={next} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Continuar</Text>
      </Pressable>
    </View>
  );
}


