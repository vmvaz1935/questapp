import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConsentScreen from './screens/ConsentScreen';
import RegionScreen from './screens/RegionScreen';
import NPRSScreen from './screens/NPRSScreen';
import RedFlagsScreen from './screens/RedFlagsScreen';
import InfoScreen from './screens/InfoScreen';
import ScaleScreen from './screens/ScaleScreen';
import ReviewScreen from './screens/ReviewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        <Stack.Screen name="Consent" component={ConsentScreen} />
        <Stack.Screen name="Region" component={RegionScreen} />
        <Stack.Screen name="NPRS" component={NPRSScreen} />
        <Stack.Screen name="RedFlags" component={RedFlagsScreen} />
        <Stack.Screen name="Info" component={InfoScreen} />
        <Stack.Screen name="Scale" component={ScaleScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


