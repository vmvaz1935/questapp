import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveForm = async (id: string, data: any) => {
  await AsyncStorage.setItem(`form:${id}`, JSON.stringify(data));
};

export const loadForm = async (id: string) => {
  const s = await AsyncStorage.getItem(`form:${id}`);
  return s ? JSON.parse(s) : null;
};


