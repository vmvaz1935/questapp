import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import SingleSelect from '../components/SingleSelect';
import { saveForm, loadForm } from '../services/storage';
import { spacing, radius } from '../styles/tokens';

export default function RegionScreen({ navigation }:any){
  const [value, setValue] = useState<string>(''); const id='ortho_baseline_v1';
  useEffect(()=>{ loadForm(id).then(s=> s?.region && setValue(s.region)); },[]);
  const submit=async()=>{
    if(!value) return;
    const s = (await loadForm(id))||{}; s.region=value; await saveForm(id,s);
    navigation.navigate('NPRS');
  };
  return (
    <View style={{ padding:spacing(2), gap:spacing(2) }}>
      <Text style={{ fontSize:24 }}>Vamos entender como você está hoje</Text>
      <SingleSelect label="Qual área está incomodando?" options={['Pescoço','Ombro','Cotovelo','Punho/Mão','Coluna lombar','Quadril','Joelho','Tornozelo/Pé']} value={value} onChange={setValue}/>
      <Pressable onPress={submit} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Continuar</Text>
      </Pressable>
    </View>
  );
}


