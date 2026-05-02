import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { getStats } from '../src/services/dataService';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const stats = getStats();

  const StatCard = ({ title, value, icon, iconLib: IconLib, color }: any) => (
    <View 
      className="bg-card dark:bg-card-dark rounded-3xl p-4 mb-4 border border-border/10 dark:border-border-dark/10 shadow-sm"
      style={{ width: (width - 48) / 2 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="p-2 rounded-2xl" style={{ backgroundColor: color + '20' }}>
          <IconLib name={icon} size={24} color={color} />
        </View>
      </View>
      <Text className="text-2xl font-bold text-text-primary dark:text-text-dark">{value}</Text>
      <Text className="text-xs text-text-secondary dark:text-text-dark-secondary font-medium">{title}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-primary dark:bg-bg-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="py-12 items-center">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
            <MaterialCommunityIcons name="family-tree" size={48} color={colors.primary} />
          </View>
          <Text className="text-4xl font-bold text-center text-text-primary dark:text-text-dark mb-2">
            شجرة عائلة <Text className="text-primary">المنافيخي</Text>
          </Text>
          <Text className="text-lg text-text-secondary dark:text-text-dark-secondary text-center mb-10">
            تصفح شجرة عائلتك العريقة
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/persons')}
            activeOpacity={0.8}
            className="bg-primary px-10 py-5 rounded-full shadow-lg shadow-primary/30 flex-row items-center"
          >
            <Ionicons name="people" size={24} color="white" className="mr-3" />
            <Text className="text-white text-xl font-bold ml-2">تصفح أفراد العائلة</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <Text className="text-xl font-bold text-text-primary dark:text-text-dark mb-6 text-right">إحصائيات العائلة</Text>
          
          <View className="flex-row flex-wrap justify-between">
            <StatCard 
              title="إجمالي الأفراد" 
              value={stats.totalPersons} 
              icon="people" 
              iconLib={Ionicons} 
              color="#0d5c63" 
            />
            <StatCard 
              title="المنافيخي" 
              value={stats.manafikhiCount} 
              icon="crown" 
              iconLib={FontAwesome5} 
              color="#b8860b" 
            />
            <StatCard 
              title="أحياء" 
              value={stats.aliveCount} 
              icon="heart" 
              iconLib={Ionicons} 
              color="#4a9d7c" 
            />
            <StatCard 
              title="المتوفون" 
              value={stats.deceasedCount} 
              icon="skull" 
              iconLib={Ionicons} 
              color="#6b6560" 
            />
            <StatCard 
              title="ذكور" 
              value={stats.malesCount} 
              icon="male" 
              iconLib={Ionicons} 
              color="#5b9" 
            />
            <StatCard 
              title="إناث" 
              value={stats.femalesCount} 
              icon="female" 
              iconLib={Ionicons} 
              color="#bc6798" 
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/settings')}
          className="mt-8 flex-row items-center justify-center p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border/5"
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} className="mr-2" />
          <Text className="text-text-secondary dark:text-text-dark-secondary font-bold ml-2">الإعدادات</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
