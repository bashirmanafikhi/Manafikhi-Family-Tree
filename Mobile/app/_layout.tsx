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
      <StatusBar 
        style={theme === 'light' ? 'dark' : 'light'} 
        translucent={true}
        backgroundColor="transparent"
      />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="persons"
          options={{
            title: 'أفراد العائلة',
            headerTitle: 'أفراد العائلة',
          }}
        />
        <Stack.Screen
          name="family-tree"
          options={{
            title: 'شجرة العائلة',
            headerTitle: 'شجرة العائلة',
          }}
        />
        <Stack.Screen
          name="kinship"
          options={{
            title: 'شو بيقربني؟',
            headerTitle: 'شو بيقربني؟',
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
        <Stack.Screen
          name="request/edit-person"
          options={{
            title: 'طلب تعديل معلومات',
            headerTitle: 'طلب تعديل معلومات',
          }}
        />
        <Stack.Screen
          name="request/add-member"
          options={{
            title: 'طلب إضافة فرد',
            headerTitle: 'طلب إضافة فرد',
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