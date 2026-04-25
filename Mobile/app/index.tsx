import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations } from '../src/types';

const PAGE_SIZE = 20;

export default function TreeScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return persons;
    const query = searchQuery.trim().toLowerCase();
    return persons.filter(p => {
      const fullName = `${p.firstName} ${p.lastName || ''}`.trim().toLowerCase();
      const father = p.father ? `${p.father.firstName} ${p.father.lastName || ''}`.trim().toLowerCase() : '';
      const mother = p.mother ? `${p.mother.firstName} ${p.mother.lastName || ''}`.trim().toLowerCase() : '';
      return fullName.includes(query) || father.includes(query) || mother.includes(query);
    });
  }, [persons, searchQuery]);

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
    const genderColor = isMale ? 'bg-[#5b9]' : 'bg-[#bc6798]';

    return (
      <TouchableOpacity
        className="rounded-2xl p-4 mb-3 border border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-sm"
        onPress={() => handlePersonPress(item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center mb-3">
          <View className={`w-10 h-10 rounded-full justify-center items-center ml-3 ${genderColor}`}>
            <Ionicons name={isMale ? 'male' : 'female'} size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
              {fullName}
            </Text>
            {!item.isAlive && (
              <View className="flex-row items-center mt-1 self-end">
                <Ionicons name="skull" size={12} color="#ef4444" />
                <Text className="text-[11px] text-red-500 font-semibold ml-1">{isMale ? 'متوفي' : 'متوفاة'}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="border-t border-black/5 dark:border-white/5 pt-3">
          <View className="flex-row items-center mb-2">
            <Ionicons name="man" size={16} color={colors.textSecondary} className="ml-2" />
            <Text className="flex-1 text-sm text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
              {getFatherName(item)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="woman" size={16} color={colors.textSecondary} className="ml-2" />
            <Text className="flex-1 text-sm text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
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
    if (searchQuery.trim() && filteredPersons.length === 0) {
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

  return (
    <View className="flex-1 bg-bg-primary dark:bg-bg-dark">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View 
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-4 pb-4 border-b border-border dark:border-border-dark bg-surface-light dark:bg-surface-dark"
      >
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.push('/settings')} 
            className="p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary dark:text-text-dark">
            شجرة عائلة المنافيخي
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="search" size={20} color={colors.textSecondary} className="mr-3" />
          <View className="flex-1 relative">
            <TextInput
              className="p-3 pr-10 rounded-xl text-base border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
              placeholder="بحث بالاسم أو اسم الأب أو الأم..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setPage(1);
              }}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-3"
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-[12px] text-left text-text-secondary dark:text-text-dark-secondary mt-2">
          {filteredPersons.length} عضو
        </Text>
      </View>

      <FlatList
        data={paginatedPersons}
        renderItem={renderPersonCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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