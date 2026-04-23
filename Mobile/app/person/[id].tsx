import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useFamily } from '../../src/context/FamilyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Person, PersonWithRelations, GENDER_COLORS } from '../../src/types';

const MALE = 'MALE' as const;

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { getPersonById, getParents, getSpouses } = useFamily();
  const { colors } = useTheme();
  const [person, setPerson] = useState<PersonWithRelations | null>(null);
  const [parents, setParents] = useState<{ father?: Person; mother?: Person }>({});
  const [spouses, setSpouses] = useState<Person[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPerson() {
      if (!id) return;
      setIsLoading(true);
      const decodedId = decodeURIComponent(id);
      const found = await getPersonById(decodedId);
      if (found) {
        setPerson(found);
        navigation.setOptions({ title: `${found.firstName} ${found.lastName || ''}` });
        
        const [parentsData, spousesData] = await Promise.all([
          getParents(decodedId),
          getSpouses(decodedId),
        ]);
        setParents(parentsData);
        setSpouses(spousesData);
      }
      setIsLoading(false);
    }
    loadPerson();
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
      </View>
    );
  }

  if (!person) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg" style={{ color: colors.text }}>الشخص غير موجود</Text>
      </View>
    );
  }

  const allImages = [person.profileImage, ...(person.additionalImages || [])].filter(Boolean) as string[];
  const hasMultipleImages = allImages.length > 1;

  const renderRelation = (relPerson: Person | undefined, label: string) => {
    if (!relPerson) return null;
    const fullName = `${relPerson.firstName} ${relPerson.lastName || ''}`.trim();
    return (
      <TouchableOpacity
        className="flex-1 p-3 rounded-lg m-1"
        style={{ backgroundColor: colors.card, minWidth: 120 }}
        onPress={() => router.push(`/person/${encodeURIComponent(relPerson.id)}`)}
      >
        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{label}</Text>
        <Text className="text-base font-semibold" style={{ color: colors.text }}>{fullName}</Text>
        <Text className="text-xs" style={{ color: relPerson.gender === MALE ? '#5b9' : '#bc6798' }}>
          {relPerson.gender === MALE ? '👨' : '👩'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      {hasMultipleImages ? (
        <View className="w-full aspect-square">
          <Image
            source={{ uri: allImages[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="flex-row justify-center items-center p-2.5">
            {allImages.map((_: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                className="w-2 h-2 rounded-full mx-1"
                style={{ backgroundColor: idx === currentImageIndex ? '#bc6798' : '#ccc' }}
                onPress={() => setCurrentImageIndex(idx)}
              />
            ))}
          </View>
        </View>
      ) : allImages.length === 1 ? (
        <Image
          source={{ uri: allImages[0] }}
          className="w-full aspect-square"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square justify-center items-center" style={{ backgroundColor: colors.surface }}>
          <Text className="text-7xl">
            {person.gender === MALE ? '👨' : '👩'}
          </Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
          {person.firstName} {person.lastName || ''}
        </Text>
        
        <View className="flex-row flex-wrap justify-center mt-5 gap-3">
          {person.birthDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الميلاد</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.birthDate}</Text>
            </View>
          )}
          
          {!person.isAlive && person.deathDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الوفاة</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.deathDate}</Text>
            </View>
          )}
          
          {person.isAlive && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>الحالة</Text>
              <Text className="text-base font-semibold" style={{ color: '#5b9' }}>على قيد الحياة</Text>
            </View>
          )}
          
          <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
            <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>الجنس</Text>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {person.gender === MALE ? 'ذكر' : 'أنثى'}
            </Text>
          </View>
        </View>

        {(parents.father || parents.mother) && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الوالدان</Text>
            <View className="flex-row flex-wrap">
              {renderRelation(parents.father, 'الأب')}
              {renderRelation(parents.mother, 'الأم')}
            </View>
          </View>
        )}

        {spouses.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الزوج/ة</Text>
            <View className="flex-row flex-wrap">
              {spouses.map(spouse => (
                <TouchableOpacity
                  key={spouse.id}
                  className="flex-1 p-3 rounded-lg m-1"
                  style={{ backgroundColor: colors.card, minWidth: 120 }}
                  onPress={() => router.push(`/person/${encodeURIComponent(spouse.id)}`)}
                >
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {spouse.firstName} {spouse.lastName || ''}
                  </Text>
                  <Text className="text-xs" style={{ color: spouse.gender === MALE ? '#5b9' : '#bc6798' }}>
                    {spouse.gender === MALE ? '👨' : '👩'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {person.children && person.children.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الأبناء ({person.children.length})</Text>
            <View className="flex-row flex-wrap">
              {person.children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  className="p-3 rounded-lg m-1"
                  style={{ backgroundColor: colors.card, minWidth: 120 }}
                  onPress={() => router.push(`/person/${encodeURIComponent(child.id)}`)}
                >
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {child.firstName} {child.lastName || ''}
                  </Text>
                  <Text className="text-xs" style={{ color: child.gender === MALE ? '#5b9' : '#bc6798' }}>
                    {child.gender === MALE ? '👨' : '👩'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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