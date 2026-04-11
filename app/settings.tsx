import React from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { AppActions } from '../src/services/AppActions';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();

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
      className="flex-row items-center justify-between p-4"
      style={{ backgroundColor: colors.card, borderColor: colors.border, borderBottomWidth: border ? 1 : 0 }}
    >
      <Text className="text-base" style={{ color: colors.text }}>
        {title}
      </Text>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 pb-8" style={{ backgroundColor: colors.surface }}>
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
          rightElement={<Ionicons name="star" size={22} color={colors.textSecondary} />}
        />
        <SettingRow
          title="مشاركة التطبيق"
          onPress={() => AppActions.shareApp()}
          rightElement={<Ionicons name="share" size={22} color={colors.textSecondary} />}
        />
        <SettingRow
          title="راسلني"
          onPress={() => AppActions.sendFeedback()}
          border={false}
          rightElement={<Ionicons name="mail" size={22} color={colors.textSecondary} />}
        />
      </View>
    </ScrollView>
  );
}