import { Stack } from 'expo-router';
import '../global.css';
import { FamilyProvider } from '../src/context/FamilyContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootStack() {
  const { theme, colors } = useTheme();
  
  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background },
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
        <Stack.Screen
          name="settings"
          options={{
            title: 'الإعدادات',
            headerTitle: 'الإعدادات',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FamilyProvider>
          <RootStack />
        </FamilyProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}