import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations } from '../src/types';
import { imageMap } from '../src/imageMap';

const PAGE_SIZE = 20;

function resolveImageSource(imagePath: string | undefined): any {
  if (!imagePath) return null;
  return imageMap[imagePath] || null;
}

function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export default function TreeScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    filterFirstName?: string;
    filterLastName?: string;
    filterGender?: string;
    filterAlive?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterLastName, setFilterLastName] = useState('');
  const [filterGender, setFilterGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [filterAlive, setFilterAlive] = useState<'ALL' | 'ALIVE' | 'DEAD'>('ALL');

  useEffect(() => {
    let changed = false;
    if (params.filterFirstName) { setFilterFirstName(params.filterFirstName); changed = true; }
    if (params.filterLastName) { setFilterLastName(params.filterLastName); changed = true; }
    if (params.filterGender) { setFilterGender(params.filterGender as 'MALE' | 'FEMALE'); changed = true; }
    if (params.filterAlive) { setFilterAlive(params.filterAlive as 'ALIVE' | 'DEAD'); changed = true; }
    if (changed) setShowFilters(true);
  }, [params.filterFirstName, params.filterLastName, params.filterGender, params.filterAlive]);

  const hasActiveFilters = filterFirstName || filterLastName || filterGender !== 'ALL' || filterAlive !== 'ALL';

  const clearFilters = useCallback(() => {
    setFilterFirstName('');
    setFilterLastName('');
    setFilterGender('ALL');
    setFilterAlive('ALL');
    setPage(1);
  }, []);

  const filteredPersons = useMemo(() => {
    let list = persons;

    if (searchQuery.trim()) {
      const q = normalizeArabic(searchQuery.trim());
      list = list.filter(p => {
        const fullName = normalizeArabic(`${p.firstName} ${p.lastName || ''}`.trim());
        const father = p.father ? normalizeArabic(`${p.father.firstName} ${p.father.lastName || ''}`.trim()) : '';
        const mother = p.mother ? normalizeArabic(`${p.mother.firstName} ${p.mother.lastName || ''}`.trim()) : '';
        return fullName.includes(q) || father.includes(q) || mother.includes(q);
      });
    }

    if (filterFirstName.trim()) {
      const q = normalizeArabic(filterFirstName.trim());
      list = list.filter(p => normalizeArabic(p.firstName).includes(q));
    }

    if (filterLastName.trim()) {
      const q = normalizeArabic(filterLastName.trim());
      list = list.filter(p => normalizeArabic(p.lastName || '').includes(q));
    }

    if (filterGender !== 'ALL') {
      list = list.filter(p => p.gender === filterGender);
    }

    if (filterAlive !== 'ALL') {
      list = list.filter(p => filterAlive === 'ALIVE' ? p.isAlive : !p.isAlive);
    }

    return list;
  }, [persons, searchQuery, filterFirstName, filterLastName, filterGender, filterAlive]);

  const paginatedPersons = useMemo(() => {
    return filteredPersons.slice(0, page * PAGE_SIZE);
  }, [filteredPersons, page]);

  const hasMore = page * PAGE_SIZE < filteredPersons.length;

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(p => p + 1);
    }
  }, [hasMore, isLoading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setRefreshing(false);
  }, []);

  const handlePersonPress = (personId: string) => {
    router.push(`/person/${encodeURIComponent(personId)}`);
  };

  const getFatherName = (person: PersonWithRelations): string => {
    if (!person.father) return '-';
    return `${person.father.firstName} ${person.father.lastName || ''}`.trim();
  };

  const getMotherName = (person: PersonWithRelations): string => {
    if (!person.mother) return '-';
    return `${person.mother.firstName} ${person.mother.lastName || ''}`.trim();
  };

  const renderPersonCard = ({ item }: { item: PersonWithRelations }) => {
    const fullName = `${item.firstName} ${item.lastName || ''}`.trim() || '(بدون اسم)';
    const isMale = item.gender === 'MALE';
    const genderColor = isMale ? 'bg-[#55bb99]' : 'bg-[#bc6798]';
    const imageSource = resolveImageSource(item.profileImage);

    return (
      <TouchableOpacity
        className="rounded-xl p-3 mb-2 border border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-sm"
        onPress={() => handlePersonPress(item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center mb-2">
          <View className={`w-9 h-9 rounded-full justify-center items-center ml-2.5 overflow-hidden ${genderColor}`}>
            {imageSource ? (
              <Image source={imageSource} style={{ width: '100%', height: '100%' } as any} />
            ) : (
              <Ionicons name={isMale ? 'male' : 'female'} size={18} color="#fff" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
              {fullName}
            </Text>
            {!item.isAlive && (
              <View className="flex-row items-center mt-0.5 self-end">
                <Ionicons name="skull" size={10} color="#ef4444" />
                <Text className="text-[9px] text-red-500 font-semibold ml-0.5">{isMale ? 'متوفي' : 'متوفاة'}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="border-t border-black/5 dark:border-white/5 pt-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="man" size={14} color={colors.textSecondary} className="ml-1.5" />
            <Text className="flex-1 text-xs text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
              {getFatherName(item)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="woman" size={14} color={colors.textSecondary} className="ml-1.5" />
            <Text className="flex-1 text-xs text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
              {getMotherName(item)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="small" color="#bc6798" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (filteredPersons.length === 0 && (searchQuery.trim() || hasActiveFilters)) {
      return (
        <View className="flex-1 justify-center items-center pt-16">
          <Ionicons name="search" size={48} color={colors.textSecondary} />
          <Text className="mt-3 text-base text-text-secondary dark:text-text-dark-secondary">
            لا توجد نتائج
          </Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading && persons.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-primary dark:bg-bg-dark">
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary">جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-bg-primary dark:bg-bg-dark">
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text className="mt-3 text-base text-center text-red-500">{error}</Text>
      </View>
    );
  }

  const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="px-3 py-1.5 rounded-full border"
      style={{
        backgroundColor: active ? colors.primary + '20' : 'transparent',
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: active ? colors.primary : colors.textSecondary }} className="text-xs font-bold">
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-bg-primary dark:bg-bg-dark">
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-4 pb-3 border-b border-border dark:border-border-dark bg-surface-light dark:bg-surface-dark"
      >
        <View className="flex-row justify-between items-center mb-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary dark:text-text-dark">
            أفراد العائلة
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilters(f => !f)}
            className="p-2 rounded-full"
            style={{ backgroundColor: showFilters ? colors.primary + '20' : 'transparent' }}
          >
            <Ionicons name="filter" size={22} color={showFilters ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="search" size={20} color={colors.textSecondary} className="mr-3" />
          <View className="flex-1 relative">
            <TextInput
              className="p-2.5 pr-10 rounded-xl text-sm border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
              placeholder="بحث بالاسم أو اسم الأب أو الأم..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => { setSearchQuery(text); setPage(1); }}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setPage(1); }} className="absolute right-2.5 top-2.5">
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showFilters && (
          <View className="mb-1">
            <View className="flex-row items-center mb-2">
              <View className="flex-1 relative">
                <TextInput
                  className="p-2 pr-8 rounded-lg text-xs border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
                  placeholder="الاسم الأول"
                  placeholderTextColor="#999"
                  value={filterFirstName}
                  onChangeText={t => { setFilterFirstName(t); setPage(1); }}
                  textAlign="right"
                />
                {filterFirstName.length > 0 && (
                  <TouchableOpacity onPress={() => { setFilterFirstName(''); setPage(1); }} className="absolute right-2 top-2">
                    <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View className="w-2" />
              <View className="flex-1 relative">
                <TextInput
                  className="p-2 pr-8 rounded-lg text-xs border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
                  placeholder="الاسم الأخير"
                  placeholderTextColor="#999"
                  value={filterLastName}
                  onChangeText={t => { setFilterLastName(t); setPage(1); }}
                  textAlign="right"
                />
                {filterLastName.length > 0 && (
                  <TouchableOpacity onPress={() => { setFilterLastName(''); setPage(1); }} className="absolute right-2 top-2">
                    <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary ml-1">الجنس:</Text>
              <FilterChip label="الكل" active={filterGender === 'ALL'} onPress={() => { setFilterGender('ALL'); setPage(1); }} />
              <FilterChip label="ذكر" active={filterGender === 'MALE'} onPress={() => { setFilterGender('MALE'); setPage(1); }} />
              <FilterChip label="أنثى" active={filterGender === 'FEMALE'} onPress={() => { setFilterGender('FEMALE'); setPage(1); }} />
            </View>

            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary ml-1">الحالة:</Text>
              <FilterChip label="الكل" active={filterAlive === 'ALL'} onPress={() => { setFilterAlive('ALL'); setPage(1); }} />
              <FilterChip label="حي" active={filterAlive === 'ALIVE'} onPress={() => { setFilterAlive('ALIVE'); setPage(1); }} />
              <FilterChip label="متوفي" active={filterAlive === 'DEAD'} onPress={() => { setFilterAlive('DEAD'); setPage(1); }} />
            </View>

            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} className="self-start mb-1">
                <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>مسح الفلاتر</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] text-text-secondary dark:text-text-dark-secondary">
            {filteredPersons.length} عضو
          </Text>
          {hasActiveFilters && (
            <View className="flex-row items-center">
              <Ionicons name="funnel" size={10} color={colors.primary} />
              <Text className="text-[10px] ml-1" style={{ color: colors.primary }}>فلتر مفعّل</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={paginatedPersons}
        renderItem={renderPersonCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#bc6798"
          />
        }
      />
    </View>
  );
}
