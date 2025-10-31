import { View, Text, Pressable } from 'react-native';
import { spacing, radius } from '../styles/tokens';

export default function InfoScreen({ route, navigation }: any){
  const { style='info', text='' } = route.params||{};
  return (
    <View style={{ padding:spacing(2), gap:spacing(2) }}>
      <View style={{ padding:spacing(2), borderRadius:radius, backgroundColor: style==='critical'? '#FEE2E2' : '#DBEAFE' }}>
        <Text style={{ fontSize:17 }}>{text}</Text>
      </View>
      <Pressable onPress={()=>navigation.navigate('Scale')} style={{ backgroundColor:'#2563EB', padding:spacing(2), borderRadius:radius }}>
        <Text style={{ color:'#fff', textAlign:'center' }}>Continuar</Text>
      </Pressable>
    </View>
  );
}


