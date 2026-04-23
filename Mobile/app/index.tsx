import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { Person, GENDER_COLORS } from '../src/types';

export default function TreeScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const childrenMap = useMemo(() => {
    const map = new Map<string, Person[]>();
    persons.forEach(p => {
      map.set(p.id, p.children || []);
    });
    return map;
  }, [persons]);

  const spouseMap = useMemo(() => {
    const map = new Map<string, Person[]>();
    persons.forEach(p => {
      map.set(p.id, p.spouses || []);
    });
    return map;
  }, [persons]);

  const parentMap = useMemo(() => {
    const map = new Map<string, { fatherId?: string; motherId?: string }>();
    persons.forEach(p => {
      map.set(p.id, { fatherId: p.fatherId, motherId: p.motherId });
    });
    return map;
  }, [persons]);

  const findAncestors = (personId: string): string[] => {
    const ancestors: string[] = [];
    let current = parentMap.get(personId);
    while (current?.fatherId || current?.motherId) {
      if (current.fatherId) ancestors.push(current.fatherId);
      if (current.motherId) ancestors.push(current.motherId);
      current = parentMap.get(current.fatherId || current.motherId!);
    }
    return ancestors;
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { personsToShow: new Set<string>(), rootIds: [] as string[] };
    const query = searchQuery.trim().toLowerCase();
    
    const matchingIds = new Set<string>();
    const personsToShow = new Set<string>();

    persons.forEach(p => {
      const fullName = `${p.firstName} ${p.lastName || ''}`.trim().toLowerCase();
      if (fullName.includes(query)) {
        matchingIds.add(p.id);
      }
    });

    matchingIds.forEach(id => {
      personsToShow.add(id);
      findAncestors(id).forEach(a => personsToShow.add(a));
      const spouses = spouseMap.get(id) || [];
      spouses.forEach(s => personsToShow.add(s.id));
    });

    const rootIds = Array.from(personsToShow).filter(id => {
      const parent = parentMap.get(id);
      return (!parent?.fatherId && !parent?.motherId) || !personsToShow.has(parent.fatherId || '') || !personsToShow.has(parent.motherId || '');
    });

    return { personsToShow, rootIds };
  }, [persons, searchQuery, parentMap, spouseMap]);

  const rootNodeIds = useMemo(() => {
    return persons
      .filter(p => !p.fatherId && !p.motherId)
      .map(p => p.id);
  }, [persons]);

  React.useEffect(() => {
    if (searchQuery.trim() && searchResults.personsToShow.size > 0) {
      setExpanded(Array.from(searchResults.personsToShow));
    }
  }, [searchQuery, searchResults]);

  const filteredRootIds = searchQuery.trim() ? searchResults.rootIds : rootNodeIds;

  const togglePerson = (personId: string) => {
    setExpanded(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handlePersonPress = (personId: string) => {
    router.push(`/person/${encodeURIComponent(personId)}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg text-center" style={{ color: '#c00' }}>{error}</Text>
      </View>
    );
  }

  const renderPerson = (personId: string, level: number, visiblePersons?: Set<string>): ReactNode => {
    const person = persons.find(p => p.id === personId);
    if (!person) return null;

    let children: Person[] = childrenMap.get(personId) || [];
    if (visiblePersons) {
      children = children.filter(c => visiblePersons.has(c.id));
    }
    const spouses = spouseMap.get(personId) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.includes(personId);
    const bgColor = GENDER_COLORS[person.gender] || GENDER_COLORS.MALE;
    const fullName = `${person.firstName} ${person.lastName || ''}`.trim() || '(بدون اسم)';

    const renderSpouse = (spouse: Person): ReactNode => {
      const spouseName = `${spouse.firstName} ${spouse.lastName || ''}`.trim();
      const spouseBgColor = GENDER_COLORS[spouse.gender] || GENDER_COLORS.FEMALE;
      
      return (
        <TouchableOpacity
          key={spouse.id}
          className="flex-row items-center p-3 rounded-lg mb-0.5 mr-1"
          style={{ backgroundColor: spouseBgColor, flexDirection: 'row' }}
          onPress={() => handlePersonPress(spouse.id)}
        >
          <Text
            className="flex-1 text-sm font-bold text-white"
            numberOfLines={1}
            style={{ textAlign: 'left' }}
          >
            {spouseName}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View key={personId} className="mb-1">
        <TouchableOpacity
          className="flex-row items-center p-3 rounded-lg mb-0.5"
          style={{ 
            backgroundColor: bgColor, 
            marginLeft: 10,
            flexDirection: 'row'
          }}
          onPress={() => hasChildren && togglePerson(personId)}
        >
          <TouchableOpacity
            onPress={() => handlePersonPress(personId)}
            className="flex-row items-center flex-1"
          >
            <Text
              className="flex-1 text-sm font-bold text-white"
              numberOfLines={1}
              style={{ textAlign: 'left' }}
            >
              {fullName}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center min-w-[45px] justify-end">
            {hasChildren && (
              <>
                <View className="bg-black/10 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-[10px] font-bold text-white">
                    {children.length}
                  </Text>
                </View>
                <View className="w-3 items-center">
                  <Text className="text-[10px] text-white/80">
                    {isExpanded ? '▼' : '◀'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {spouses.length > 0 && (
          <View className="flex-row mr-2">
            {spouses.map(spouse => renderSpouse(spouse))}
          </View>
        )}

        {isExpanded && hasChildren && (
          <View
            className="border-l-2 pt-1"
            style={{ borderColor: '#bc6798', marginLeft: 10 }}
          >
            {children.map((child) => renderPerson(child.id, level + 1, visiblePersons))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-3 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-2">
          <TextInput
            className="flex-1 p-2.5 rounded-lg text-base"
            style={{ backgroundColor: colors.card, color: colors.text, textAlign: 'right' }}
            placeholder="بحث..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          {persons.length} أعضاء
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="p-4">
          {filteredRootIds.map(rootId => renderPerson(rootId, 0, searchQuery.trim() ? searchResults.personsToShow : undefined))}
        </View>
      </ScrollView>

      <View className="p-3 pb-12 border-t" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push('/settings')} className="flex-row justify-center items-center py-2">
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}