import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useFamily } from '../../src/context/FamilyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Person, PersonWithRelations } from '../../src/types';

const MALE = 'MALE' as const;

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { getPersonById, getParents, getSpouses } = useFamily();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
      <View className="flex-1 justify-center items-center bg-bg-primary dark:bg-bg-dark">
        <ActivityIndicator size="large" color="#bc6798" />
      </View>
    );
  }

  if (!person) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-primary dark:bg-bg-dark">
        <Text className="text-lg text-text-primary dark:text-text-dark">الشخص غير موجود</Text>
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
        className="flex-1 p-3 rounded-lg m-1 bg-card dark:bg-card-dark min-w-[120px]"
        onPress={() => router.replace(`/person/${encodeURIComponent(relPerson.id)}`)}
      >
        <Text className="text-xs mb-1 text-text-secondary dark:text-text-dark-secondary">{label}</Text>
        <Text className="text-base font-semibold text-text-primary dark:text-text-dark">{fullName}</Text>
        <Text className={relPerson.gender === MALE ? 'text-[#5b9]' : 'text-[#bc6798]'}>
          <Ionicons name={relPerson.gender === MALE ? 'male' : 'female'} size={16} color={relPerson.gender === MALE ? '#5b9' : '#bc6798'} />
        </Text>
      </TouchableOpacity>
    );
  };

  const imageSection = (
    <View className={isLandscape ? "w-1/3 aspect-square" : "w-full aspect-square"}>
      {hasMultipleImages ? (
        <View className="w-full h-full">
          <Image
            source={{ uri: allImages[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="flex-row justify-center items-center p-2.5 absolute bottom-0 left-0 right-0 bg-black/30">
            {allImages.map((_: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                className={`w-2 h-2 rounded-full mx-1 ${idx === currentImageIndex ? 'bg-primary' : 'bg-gray-300'}`}
                onPress={() => setCurrentImageIndex(idx)}
              />
            ))}
          </View>
        </View>
      ) : allImages.length === 1 ? (
        <Image
          source={{ uri: allImages[0] }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full justify-center items-center bg-surface-light dark:bg-surface-dark">
          <Ionicons name={person.gender === MALE ? 'male' : 'female'} size={isLandscape ? 80 : 48} color={person.gender === MALE ? '#5b9' : '#bc6798'} />
        </View>
      )}
    </View>
  );

  const mainInfo = (
    <View className={isLandscape ? "flex-1 p-6" : "p-4"}>
      <Text className="text-2xl font-bold text-center text-text-primary dark:text-text-dark">
        {person.firstName} {person.lastName || ''}
      </Text>

      {!!person.nickname && (
        <Text className="text-lg text-center mt-1 text-text-secondary dark:text-text-dark-secondary">
          ({person.nickname})
        </Text>
      )}

      <View className="flex-row flex-wrap justify-center mt-5 gap-3">
        {!!person.birthDate && (
          <View className="p-3 rounded-lg min-w-[100px] bg-surface-light dark:bg-surface-dark">
            <Text className="text-xs mb-1 text-text-secondary dark:text-text-dark-secondary">تاريخ الميلاد</Text>
            <Text className="text-base font-semibold text-text-primary dark:text-text-dark">{formatDate(person.birthDate)}</Text>
          </View>
        )}

        {!person.isAlive && !!person.deathDate && (
          <View className="p-3 rounded-lg min-w-[100px] bg-surface-light dark:bg-surface-dark">
            <Text className="text-xs mb-1 text-text-secondary dark:text-text-dark-secondary">تاريخ الوفاة</Text>
            <Text className="text-base font-semibold text-text-primary dark:text-text-dark">{formatDate(person.deathDate)}</Text>
          </View>
        )}

        <View className="p-3 rounded-lg min-w-[100px] bg-surface-light dark:bg-surface-dark">
          <Text className="text-xs mb-1 text-text-secondary dark:text-text-dark-secondary">الحالة</Text>
          <Text className={`text-base font-semibold ${person.isAlive ? 'text-[#5b9]' : 'text-red-500'}`}>
            {person.isAlive ? 'على قيد الحياة' : (person.gender === MALE ? 'متوفى' : 'متوفاة')}
          </Text>
        </View>

        <View className="p-3 rounded-lg min-w-[100px] bg-surface-light dark:bg-surface-dark">
          <Text className="text-xs mb-1 text-text-secondary dark:text-text-dark-secondary">الجنس</Text>
          <Text className="text-base font-semibold text-text-primary dark:text-text-dark">
            {person.gender === MALE ? 'ذكر' : 'أنثى'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-bg-primary dark:bg-bg-dark">
      {isLandscape ? (
        <View className="flex-row">
          {imageSection}
          {mainInfo}
        </View>
      ) : (
        <>
          {imageSection}
          {mainInfo}
        </>
      )}

      <View className="px-4 pb-10">
        {(!!parents.father || !!parents.mother) && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3 text-text-primary dark:text-text-dark">الوالدان</Text>
            <View className="flex-row flex-wrap">
              {renderRelation(parents.father, 'الأب')}
              {renderRelation(parents.mother, 'الأم')}
            </View>
          </View>
        )}

        {spouses.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3 text-text-primary dark:text-text-dark">
              {person.gender === MALE ? 'الزوجة' : 'الزوج'}
            </Text>
            <View className="flex-row flex-wrap">
              {spouses.map(spouse => (
                <TouchableOpacity
                  key={spouse.id}
                  className="flex-1 p-3 rounded-lg m-1 bg-card dark:bg-card-dark min-w-[120px]"
                  onPress={() => router.replace(`/person/${encodeURIComponent(spouse.id)}`)}
                >
                  <Text className="text-base font-semibold text-text-primary dark:text-text-dark">
                    {spouse.firstName} {spouse.lastName || ''}
                  </Text>
                  <Text className={spouse.gender === MALE ? 'text-[#5b9]' : 'text-[#bc6798]'}>
                    <Ionicons name={spouse.gender === MALE ? 'male' : 'female'} size={16} color={spouse.gender === MALE ? '#5b9' : '#bc6798'} />
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!!person.children && person.children.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3 text-text-primary dark:text-text-dark">الأبناء ({person.children.length})</Text>
            <View className="flex-row flex-wrap">
              {person.children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  className="p-3 rounded-lg m-1 bg-card dark:bg-card-dark min-w-[120px]"
                  onPress={() => router.replace(`/person/${encodeURIComponent(child.id)}`)}
                >
                  <Text className="text-base font-semibold text-text-primary dark:text-text-dark">
                    {child.firstName} {child.lastName || ''}
                  </Text>
                  <Text className={child.gender === MALE ? 'text-[#5b9]' : 'text-[#bc6798]'}>
                    <Ionicons name={child.gender === MALE ? 'male' : 'female'} size={16} color={child.gender === MALE ? '#5b9' : '#bc6798'} />
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!!person.siblings && person.siblings.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3 text-text-primary dark:text-text-dark">الاخوة ({person.siblings.length})</Text>
            <View className="flex-row flex-wrap">
              {person.siblings.map(sibling => (
                <TouchableOpacity
                  key={sibling.id}
                  className="p-3 rounded-lg m-1 bg-card dark:bg-card-dark min-w-[120px]"
                  onPress={() => router.replace(`/person/${encodeURIComponent(sibling.id)}`)}
                >
                  <Text className="text-base font-semibold text-text-primary dark:text-text-dark">
                    {sibling.firstName} {sibling.lastName || ''}
                  </Text>
                  <Text className={sibling.gender === MALE ? 'text-[#5b9]' : 'text-[#bc6798]'}>
                    <Ionicons name={sibling.gender === MALE ? 'male' : 'female'} size={16} color={sibling.gender === MALE ? '#5b9' : '#bc6798'} />
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!!person.bio && (
          <View className="mt-6 p-4 rounded-xl bg-surface-light dark:bg-surface-dark">
            <Text className="text-lg font-bold mb-3 text-text-primary dark:text-text-dark">السيرة الذاتية</Text>
            <Text className="text-base leading-6 text-text-secondary dark:text-text-dark-secondary">{person.bio}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}