import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useFamily } from '../../src/context/FamilyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Person } from '../../src/types';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { persons } = useFamily();
  const { colors } = useTheme();
  const [person, setPerson] = useState<Person | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      const decodedId = decodeURIComponent(id);
      const found = persons.find(p => p.id === decodedId);
      if (found) {
        setPerson(found);
        navigation.setOptions({ title: found.name });
      }
    }
  }, [id, persons]);

  if (!person) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
      </View>
    );
  }

  const images = person.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      {hasMultipleImages ? (
        <View className="w-full aspect-square">
          <Image
            source={{ uri: images[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="flex-row justify-center items-center p-2.5">
            {images.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                className="w-2 h-2 rounded-full mx-1"
                style={{ backgroundColor: idx === currentImageIndex ? '#bc6798' : '#ccc' }}
                onPress={() => setCurrentImageIndex(idx)}
              />
            ))}
          </View>
        </View>
      ) : images.length === 1 ? (
        <Image
          source={{ uri: images[0] }}
          className="w-full aspect-square"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square justify-center items-center" style={{ backgroundColor: colors.surface }}>
          <Text className="text-7xl">
            {person.gender === 'female' ? '👩' : '👨'}
          </Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
          {person.name}
        </Text>
        
        {person.nickname && (
          <Text className="text-lg text-center mt-1 italic" style={{ color: colors.textSecondary }}>
            "{person.nickname}"
          </Text>
        )}

        <View className="flex-row flex-wrap justify-center mt-5 gap-3">
          {person.birthDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الميلاد</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.birthDate}</Text>
            </View>
          )}
          
          {person.deathDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الوفاة</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.deathDate}</Text>
            </View>
          )}
          
          {person.occupation && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>المهنة</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.occupation}</Text>
            </View>
          )}
          
          {person.gender && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>الجنس</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {person.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Text>
            </View>
          )}
        </View>

        {person.bio && (
          <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>السيرة الذاتية</Text>
            <Text className="text-base leading-6" style={{ color: colors.textSecondary }}>{person.bio}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}