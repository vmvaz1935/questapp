import { View, Text } from 'react-native';
// @ts-ignore: slider native dep resolved by Expo
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../styles/tokens';

export default function NPRSSlider({ label, min=0, max=10, value, onChange }:{
  label:string; min?:number; max?:number; value:number; onChange:(v:number)=>void;
}) {
  return (
    <View accessible accessibilityLabel={label}>
      <Text style={{ fontSize:17, marginBottom:spacing(1) }}>{label}</Text>
      <Slider minimumValue={min} maximumValue={max} step={1} value={value}
        minimumTrackTintColor={colors.primary} maximumTrackTintColor="#D1D5DB"
        onValueChange={onChange} accessibilityRole="adjustable" />
      <Text style={{ textAlign:'center', marginTop:spacing(1) }}>{value}</Text>
    </View>
  );
}


