import React from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { AppActions } from '../src/services/AppActions';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  const SettingRow = ({ 
    title, 
    onPress, 
    rightElement,
    border = true 
  }: { 
    title: string; 
    onPress?: () => void; 
    rightElement?: React.ReactNode;
    border?: boolean;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between p-4 bg-card dark:bg-card-dark ${border ? 'border-b border-border dark:border-border-dark' : ''}`}
    >
      <Text className="text-base text-text-primary dark:text-text-dark">
        {title}
      </Text>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 pb-8 bg-surface-light dark:bg-surface-dark">
      <View className="mx-4 mt-4 rounded-xl overflow-hidden">
        <SettingRow
          title={theme === 'light' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          onPress={toggleTheme}
          rightElement={
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e0e0e0', true: '#bc6798' }}
              thumbColor={theme === 'dark' ? '#fff' : '#f5f5f5'}
            />
          }
        />
      </View>

      <View className="mx-4 mt-4 rounded-xl overflow-hidden">
        <SettingRow
          title="تقييم التطبيق"
          onPress={() => AppActions.rateApp()}
          rightElement={<Ionicons name="star" size={22} className="text-text-secondary dark:text-text-dark-secondary" />}
        />
        <SettingRow
          title="مشاركة التطبيق"
          onPress={() => AppActions.shareApp()}
          rightElement={<Ionicons name="share" size={22} className="text-text-secondary dark:text-text-dark-secondary" />}
        />
        <SettingRow
          title="راسلني"
          onPress={() => AppActions.sendFeedback()}
          border={false}
          rightElement={<Ionicons name="mail" size={22} className="text-text-secondary dark:text-text-dark-secondary" />}
        />
      </View>
    </ScrollView>
  );
}