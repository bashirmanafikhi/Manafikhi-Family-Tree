import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations } from '../src/types';

const PAGE_SIZE = 20;

export default function TreeScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const personMap = useMemo(() => {
    const map = new Map<string, PersonWithRelations>();
    persons.forEach(p => map.set(p.id, p));
    return map;
  }, [persons]);

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
    const genderColor = isMale ? '#5b9' : '#bc6798';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handlePersonPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.genderBadge, { backgroundColor: genderColor }]}>
            <Ionicons name={isMale ? 'male' : 'female'} size={20} color="#fff" />
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {fullName}
            </Text>
            {!item.isAlive && (
              <View style={styles.deceasedBadge}>
                <Ionicons name="skull" size={12} color="#ef4444" />
                <Text style={styles.deceasedText}>متوفي</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="man" size={16} color={colors.textSecondary} style={styles.labelIcon} />
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {getFatherName(item)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="woman" size={16} color={colors.textSecondary} style={styles.labelIcon} />
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
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
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (searchQuery.trim() && filteredPersons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            لا توجد نتائج
          </Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading && persons.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#bc6798" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color="#c00" />
        <Text style={[styles.errorText, { color: '#c00' }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
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
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {filteredPersons.length} عضو
        </Text>
      </View>

      <FlatList
        data={paginatedPersons}
        renderItem={renderPersonCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 36 }]}>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.settingsText, { color: colors.textSecondary }]}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  countText: {
    fontSize: 13,
    textAlign: 'left',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  nameContainer: {
    flex: 1,
  },
  deceasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  deceasedText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginLeft: 8,
    width: 20,
  },
  value: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingsText: {
    marginLeft: 8,
    fontSize: 14,
  },
});