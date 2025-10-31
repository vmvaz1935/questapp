import { Pressable, Text, View } from 'react-native';
import { colors, spacing, radius } from '../styles/tokens';

export default function SingleSelect({ label, options, value, onChange }:{
  label: string; options: string[]; value?: string; onChange: (v:string)=>void;
}) {
  return (
    <View accessible accessibilityLabel={label} style={{ gap: spacing(1) }}>
      <Text style={{ fontSize:17, color:colors.text }}>{label}</Text>
      {options.map(opt => (
        <Pressable key={opt} onPress={() => onChange(opt)}
          accessibilityRole="button" accessibilityState={{ selected: value===opt }}
          style={{ padding:spacing(2), borderRadius:radius, borderWidth:1, borderColor:'#E5E7EB',
            backgroundColor: value===opt? colors.primary : colors.surface }}>
          <Text style={{ color: value===opt? '#fff' : colors.text }}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}


