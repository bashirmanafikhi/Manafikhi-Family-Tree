import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import Constants from 'expo-constants';
import { useFamily } from '../../src/context/FamilyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Person, PersonWithRelations } from '../../src/types';

const MALE = 'MALE' as const;

const imageCache: Record<string, string> = {};

function resolveImageUri(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;

  // For an offline app, we use local asset paths.
  // If the images are bundled in the assets folder, we can access them via local URIs.
  // Note: On Android, bundled assets are accessed via 'asset:/'
  // On iOS, they are accessed via the local file path.

  if (Platform.OS === 'android') {
    return `asset:/${imagePath}`;
  }

  // Default to a local path (works for iOS bundled assets and web)
  return imagePath;
}

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
  const { colors, theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [person, setPerson] = useState<PersonWithRelations | null>(null);
  const [parents, setParents] = useState<{ father?: Person; mother?: Person }>({});
  const [spouses, setSpouses] = useState<Person[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUris, setImageUris] = useState<string[]>([]);

  useEffect(() => {
    async function loadPerson() {
      if (!id) return;
      setIsLoading(true);
      const decodedId = decodeURIComponent(id);
      const found = await getPersonById(decodedId);
      if (found) {
        setPerson(found);
        navigation.setOptions({
          title: `${found.firstName} ${found.lastName || ''}`,
          headerTransparent: !isLandscape,
          headerTintColor: !isLandscape ? '#fff' : colors.text,
        });

        const [parentsData, spousesData] = await Promise.all([
          getParents(decodedId),
          getSpouses(decodedId),
        ]);
        setParents(parentsData);
        setSpouses(spousesData);

        const allImgPaths = [found.profileImage, ...(found.additionalImages || [])].filter(Boolean) as string[];
        const uris = allImgPaths.map(p => resolveImageUri(p)).filter(Boolean) as string[];
        setImageUris(uris);
      }
      setIsLoading(false);
    }
    loadPerson();
  }, [id, colors.text]);

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

  const hasMultipleImages = imageUris.length > 1;
  const hasImages = imageUris.length > 0;

  const renderRelationCard = (relPerson: Person | undefined, label: string, icon: string, key?: string) => {
    if (!relPerson) return null;
    const fullName = `${relPerson.firstName} ${relPerson.lastName || ''}`.trim();
    const relImage = resolveImageUri(relPerson.profileImage);

    return (
      <TouchableOpacity
        key={key}
        className="flex-1 min-w-[45%] m-1.5 p-3 rounded-2xl bg-card dark:bg-card-dark shadow-sm border border-border/10 dark:border-border-dark/10"
        onPress={() => router.replace(`/person/${encodeURIComponent(relPerson.id)}`)}
      >
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-full overflow-hidden bg-surface-light dark:bg-surface-dark items-center justify-center mr-3">
            {relImage ? (
              <Image source={{ uri: relImage }} className="w-full h-full" />
            ) : (
              <Ionicons name={relPerson.gender === MALE ? 'male' : 'female'} size={20} color={relPerson.gender === MALE ? '#5b9' : '#bc6798'} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-text-secondary dark:text-text-dark-secondary">{label}</Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-dark" numberOfLines={1}>{fullName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const imageSection = (
    <View className={isLandscape ? "w-1/3 aspect-square" : "w-full aspect-[4/5]"}>
      {hasImages ? (
        <View className="w-full h-full">
          <Image
            source={{ uri: imageUris[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {!isLandscape && (
            <View className="absolute inset-0 bg-black/20" />
          )}
          {hasMultipleImages && (
            <View className="flex-row justify-center items-center p-3 absolute bottom-0 left-0 right-0 bg-black/30">
              {imageUris.map((_: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full mx-1 ${idx === currentImageIndex ? 'bg-primary' : 'bg-white/50'}`}
                  onPress={() => setCurrentImageIndex(idx)}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="w-full h-full justify-center items-center bg-primary/10 dark:bg-primary/20">
          <Ionicons name={person.gender === MALE ? 'person' : 'person'} size={isLandscape ? 100 : 120} color={colors.primary} alpha={0.5} />
          <View className="absolute bottom-10">
            <Ionicons name={person.gender === MALE ? 'male' : 'female'} size={40} color={person.gender === MALE ? '#5b9' : '#bc6798'} />
          </View>
        </View>
      )}
    </View>
  );

  const mainInfo = (
    <View className={isLandscape ? "flex-1 p-8" : "px-6 pt-6 pb-4 -mt-10 bg-bg-primary dark:bg-bg-dark rounded-t-[40px]"}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-text-primary dark:text-text-dark">
            {person.firstName} {person.lastName || ''}
          </Text>
          {!!person.nickname && (
            <Text className="text-lg text-primary font-medium mt-1">
              {person.nickname}
            </Text>
          )}
        </View>
        <View className={`px-4 py-1.5 rounded-full ${person.isAlive ? 'bg-[#5b9]/20' : 'bg-red-500/20'}`}>
          <Text className={`text-xs font-bold ${person.isAlive ? 'text-[#387]' : 'text-red-600'}`}>
            {person.isAlive ? 'على قيد الحياة' : (person.gender === MALE ? 'متوفى' : 'متوفاة')}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap mt-8 gap-4">
        <View className="flex-1 min-w-[40%] p-4 rounded-3xl bg-surface-light dark:bg-surface-dark flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 items-center justify-center mr-3">
            <MaterialCommunityIcons name="cake-variant" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mb-0.5">تاريخ الميلاد</Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-dark">{formatDate(person.birthDate) || 'غير معروف'}</Text>
          </View>
        </View>

        {!person.isAlive && (
          <View className="flex-1 min-w-[40%] p-4 rounded-3xl bg-surface-light dark:bg-surface-dark flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 items-center justify-center mr-3">
              <MaterialCommunityIcons name="skull-outline" size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mb-0.5">تاريخ الوفاة</Text>
              <Text className="text-sm font-bold text-text-primary dark:text-text-dark">{formatDate(person.deathDate) || 'غير معروف'}</Text>
            </View>
          </View>
        )}

        <View className="flex-1 min-w-[40%] p-4 rounded-3xl bg-surface-light dark:bg-surface-dark flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 items-center justify-center mr-3">
            <Ionicons name={person.gender === MALE ? 'male' : 'female'} size={20} color={person.gender === MALE ? '#5b9' : '#bc6798'} />
          </View>
          <View>
            <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mb-0.5">الجنس</Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-dark">
              {person.gender === MALE ? 'ذكر' : 'أنثى'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-bg-primary dark:bg-bg-dark"
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={isLandscape ? [] : []}
    >
      <View>
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

        <View className="px-6 pb-12">
          {!!person.bio && (
            <View className="mt-8">
              <Text className="text-xl font-bold mb-4 text-text-primary dark:text-text-dark">السيرة الذاتية</Text>
              <View className="p-5 rounded-[30px] bg-surface-light dark:bg-surface-dark">
                <Text className="text-base leading-7 text-text-secondary dark:text-text-dark-secondary">{person.bio}</Text>
              </View>
            </View>
          )}

          {(!!parents.father || !!parents.mother) && (
            <View className="mt-10">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="family-tree" size={18} color={colors.primary} />
                </View>
                <Text className="text-xl font-bold text-text-primary dark:text-text-dark">الوالدان</Text>
              </View>
              <View className="flex-row flex-wrap">
                {renderRelationCard(parents.father, 'الأب', 'male')}
                {renderRelationCard(parents.mother, 'الأم', 'female')}
              </View>
            </View>
          )}

          {spouses.length > 0 && (
            <View className="mt-10">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="heart" size={18} color="#e11d48" />
                </View>
                <Text className="text-xl font-bold text-text-primary dark:text-text-dark">
                  {person.gender === MALE ? 'الزوجات' : 'الأزواج'}
                </Text>
              </View>
              <View className="flex-row flex-wrap">
                {spouses.map(spouse => renderRelationCard(spouse, person.gender === MALE ? 'الزوجة' : 'الزوج', spouse.gender === MALE ? 'male' : 'female', spouse.id))}
              </View>
            </View>
          )}

          {!!person.children && person.children.length > 0 && (
            <View className="mt-10">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <FontAwesome5 name="child" size={18} color={colors.primary} />
                </View>
                <Text className="text-xl font-bold text-text-primary dark:text-text-dark">الأبناء ({person.children.length})</Text>
              </View>
              <View className="flex-row flex-wrap">
                {person.children.map(child => renderRelationCard(child, child.gender === MALE ? 'ابن' : 'ابنة', child.gender === MALE ? 'male' : 'female', child.id))}
              </View>
            </View>
          )}

          {!!person.siblings && person.siblings.length > 0 && (
            <View className="mt-10">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <Text className="text-xl font-bold text-text-primary dark:text-text-dark">الإخوة ({person.siblings.length})</Text>
              </View>
              <View className="flex-row flex-wrap">
                {person.siblings.map(sibling => renderRelationCard(sibling, sibling.gender === MALE ? 'أخ' : 'أخت', sibling.gender === MALE ? 'male' : 'female', sibling.id))}
              </View>
            </View>
          )}

          {imageUris.length > 1 && (
            <View className="mt-10">
              <Text className="text-xl font-bold mb-4 text-text-primary dark:text-text-dark">معرض الصور</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {imageUris.map((uri: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    className="w-24 h-24 rounded-2xl overflow-hidden mr-3 border border-border/20 dark:border-border-dark/20 shadow-sm"
                    onPress={() => setCurrentImageIndex(idx)}
                  >
                    <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                    {currentImageIndex === idx && (
                      <View className="absolute inset-0 bg-primary/20 items-center justify-center">
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}