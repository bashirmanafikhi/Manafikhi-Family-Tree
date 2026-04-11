import { Stack } from 'expo-router';
import { FamilyProvider } from '../src/context/FamilyContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FamilyProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#f5f5f5' },
            headerTintColor: '#333',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'شجرة عائلة المنافيخي',
              headerTitle: 'شجرة عائلة المنافيخي',
            }}
          />
          <Stack.Screen
            name="person/[id]"
            options={{
              title: 'التفاصيل',
              headerTitle: 'التفاصيل',
            }}
          />
        </Stack>
      </FamilyProvider>
    </SafeAreaProvider>
  );
}