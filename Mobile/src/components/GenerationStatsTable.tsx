import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface GenerationStatsTableProps {
  descendantGenerations: [number, any[]][];
}

const generationLabels: Record<number, string> = {
  1: 'الأولاد',
  2: 'الأحفاد',
  3: 'أبناء الأحفاد',
  4: 'أحفاد الأحفاد',
  5: 'أبناء أحفاد الأحفاد',
  6: 'أحفاد أحفاد الأحفاد',
};

export default function GenerationStatsTable({ descendantGenerations }: GenerationStatsTableProps) {
  const { colors } = useTheme();

  if (!descendantGenerations || descendantGenerations.length === 0) return null;

  const getGenderStats = (nodes: any[]) => {
    const males = nodes.filter(n => n.gender === 'MALE').length;
    const females = nodes.filter(n => n.gender === 'FEMALE').length;
    return { males, females };
  };

  const allNodes = descendantGenerations.flatMap(item => item[1]);
  const totalStats = getGenderStats(allNodes);

  return (
    <View className="mt-10 p-5 rounded-[30px] bg-card dark:bg-card-dark border border-border/10 dark:border-border-dark/10 shadow-sm">
      <View className="flex-row items-center mb-6">
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
          <MaterialCommunityIcons name="chart-bar" size={18} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-text-primary dark:text-text-dark">إحصائيات الذرية</Text>
      </View>

      <View className="border-b border-border/50 dark:border-border-dark/50 pb-2 mb-2 flex-row">
        <Text className="flex-[2] text-right font-bold text-xs text-text-secondary dark:text-text-dark-secondary">الجيل</Text>
        <Text className="flex-1 text-center font-bold text-xs text-text-secondary dark:text-text-dark-secondary">الكل</Text>
        <Text className="flex-1 text-center font-bold text-xs text-[#5b9]">ذكور</Text>
        <Text className="flex-1 text-center font-bold text-xs text-[#bc6798]">إناث</Text>
      </View>

      {descendantGenerations.map(([gen, nodes]) => {
        const { males, females } = getGenderStats(nodes);
        const total = males + females;
        
        return (
          <View key={gen} className="py-3 border-b border-border/20 dark:border-border-dark/20 flex-row items-center">
            <Text className="flex-[2] text-right text-sm font-medium text-text-primary dark:text-text-dark">
              {generationLabels[gen] || `الجيل ${gen}`}
            </Text>
            <Text className="flex-1 text-center text-sm font-bold text-text-primary dark:text-text-dark">{total}</Text>
            <Text className="flex-1 text-center text-sm text-[#5b9] font-medium">{males}</Text>
            <Text className="flex-1 text-center text-sm text-[#bc6798] font-medium">{females}</Text>
          </View>
        );
      })}

      <View className="pt-4 flex-row items-center">
        <Text className="flex-[2] text-right text-sm font-bold text-text-primary dark:text-text-dark">المجموع الكلي</Text>
        <Text className="flex-1 text-center text-sm font-black text-text-primary dark:text-text-dark">{totalStats.males + totalStats.females}</Text>
        <Text className="flex-1 text-center text-sm text-[#5b9] font-black">{totalStats.males}</Text>
        <Text className="flex-1 text-center text-sm text-[#bc6798] font-black">{totalStats.females}</Text>
      </View>
    </View>
  );
}
