import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  UIManager,
  LayoutAnimation,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations } from '../src/types';
import { imageMap } from '../src/imageMap';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INDENT_WIDTH = 20;
const MALE_COLOR = '#5b9';
const FEMALE_COLOR = '#bc6798';

interface TreeNode {
  person: PersonWithRelations;
  depth: number;
  guideLines: boolean[];
  hasChildren: boolean;
  childCount: number;
  isExpanded: boolean;
}

function getFullName(p: PersonWithRelations): string {
  return `${p.firstName} ${p.lastName || ''}`.trim() || '(بدون اسم)';
}

function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

function sortPersons(list: PersonWithRelations[]): PersonWithRelations[] {
  return [...list].sort((a, b) => {
    const ay = a.birthDate ? new Date(a.birthDate).getTime() : Infinity;
    const by = b.birthDate ? new Date(b.birthDate).getTime() : Infinity;
    if (ay !== by) return ay - by;
    return a.firstName.localeCompare(b.firstName, 'ar');
  });
}

function belongsUnder(child: PersonWithRelations, parentId: string): boolean {
  if (child.father?.id === parentId) return true;
  if (child.mother?.id === parentId) return true;
  return false;
}

function resolveImageSource(imagePath: string | undefined): any {
  if (!imagePath) return null;
  return imageMap[imagePath] || null;
}

export default function FamilyTreeScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const nodeMap = useMemo(() => {
    const map = new Map<string, PersonWithRelations>();
    persons.forEach(p => map.set(p.id, p));
    return map;
  }, [persons]);

  const roots = useMemo(() => {
    const unmariedRoots = persons.filter(p => !p.father && !p.mother && p.spouses.length === 0);
    const unmariedIds = new Set(unmariedRoots.map(p => p.id));
    const orphaned = persons.filter(p => {
      if (p.fatherId || p.motherId) return false;
      if (p.spouses.length > 0) return false;
      const father = p.fatherId ? nodeMap.get(p.fatherId) : null;
      const mother = p.motherId ? nodeMap.get(p.motherId) : null;
      const fatherInTree = father && unmariedIds.has(father.id);
      const motherInTree = mother && unmariedIds.has(mother.id);
      if (fatherInTree || motherInTree) return false;
      if (father && father.spouses.length > 0 && !unmariedIds.has(father.id)) return true;
      if (mother && mother.spouses.length > 0 && !unmariedIds.has(mother.id)) return true;
      return false;
    });
    return sortPersons([...unmariedRoots, ...orphaned]);
  }, [persons, nodeMap]);

  useEffect(() => {
    if (persons.length > 0) {
      setExpanded(new Set(roots.filter(r => r.children && r.children.length > 0).map(r => r.id)));
    }
  }, [persons, roots]);

  const searchMatchIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = normalizeArabic(searchQuery.trim());
    const matches = new Set<string>();
    for (const p of persons) {
      const fatherName = p.father ? p.father.firstName : '';
      const fullName = `${p.firstName} ${fatherName}`;
      if (normalizeArabic(fullName).includes(q)) {
        matches.add(p.id);
      }
    }
    return matches;
  }, [persons, searchQuery]);

  const searchAncestorIds = useMemo(() => {
    if (!searchMatchIds) return null;
    const ancestorIds = new Set<string>();
    const getAncestors = (personId: string) => {
      const visited = new Set<string>();
      const queue = [personId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const p = nodeMap.get(id);
        if (!p) continue;
        if (p.fatherId) queue.push(p.fatherId);
        if (p.motherId) queue.push(p.motherId);
      }
      visited.delete(personId);
      return visited;
    };
    for (const id of searchMatchIds) {
      const ancestors = getAncestors(id);
      for (const a of ancestors) ancestorIds.add(a);
    }
    return ancestorIds;
  }, [searchMatchIds, nodeMap]);

  const searchAutoExpand = useMemo(() => {
    if (!searchAncestorIds) return null;
    return new Set([...searchAncestorIds, ...(searchMatchIds || [])]);
  }, [searchAncestorIds, searchMatchIds]);

  useEffect(() => {
    if (searchAutoExpand) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(prev => {
        const next = new Set(prev);
        for (const id of searchAutoExpand) next.add(id);
        return next;
      });
    }
  }, [searchAutoExpand]);

  const visibleNodes = useMemo(() => {
    const out: TreeNode[] = [];
    const rendered = new Set<string>();

    const walk = (
      nodes: PersonWithRelations[],
      depth: number,
      guideLines: boolean[],
      ancestors: Set<string>
    ) => {
      const sorted = sortPersons(nodes);
      sorted.forEach((node, idx) => {
        if (rendered.has(node.id) || ancestors.has(node.id)) return;
        if (searchMatchIds && !searchMatchIds.has(node.id) && !searchAncestorIds?.has(node.id)) return;
        rendered.add(node.id);

        const kids = (node.children || [])
          .map(c => nodeMap.get(c.id))
          .filter((c): c is PersonWithRelations => !!c)
          .filter(c => !rendered.has(c.id) && !ancestors.has(c.id) && belongsUnder(c, node.id));

        const isLast = idx === sorted.length - 1;
        const isExpanded = expanded.has(node.id) && kids.length > 0;

        out.push({
          person: node,
          depth,
          guideLines,
          hasChildren: kids.length > 0,
          childCount: kids.length,
          isExpanded,
        });

        if (isExpanded) {
          walk(kids, depth + 1, [...guideLines, !isLast], new Set([...ancestors, node.id]));
        }
      });
    };

    walk(roots, 0, [], new Set());
    return out;
  }, [roots, nodeMap, expanded, searchMatchIds, searchAncestorIds]);

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(persons.filter(p => p.children && p.children.length > 0).map(p => p.id)));
  }, [persons]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const openDetails = useCallback((id: string) => {
    router.push(`/person/${encodeURIComponent(id)}`);
  }, [router]);

  const renderGuides = (guideLines: boolean[], depth: number) => {
    if (depth === 0) return null;
    const lineColor = colors.border + '60';
    return (
      <View style={{ width: depth * INDENT_WIDTH + 4 }}>
        {guideLines.map((hasLineBelow, i) => (
          <View
            key={i}
            className="absolute top-0 bottom-0"
            style={{ left: i * INDENT_WIDTH + INDENT_WIDTH / 2 - 0.5, width: 1 }}
          >
            <View
              style={{
                width: 1,
                height: hasLineBelow ? '100%' : '50%',
                backgroundColor: lineColor,
              }}
            />
          </View>
        ))}
        <View
          className="absolute"
          style={{
            left: (depth - 1) * INDENT_WIDTH + INDENT_WIDTH / 2,
            width: INDENT_WIDTH / 2,
            top: '50%',
            height: 1,
            marginTop: -0.5,
            backgroundColor: lineColor,
          }}
        />
      </View>
    );
  };

  const renderItem = ({ item }: { item: TreeNode }) => {
    const { person, depth, hasChildren, childCount, isExpanded } = item;
    const isMale = person.gender === 'MALE';
    const genderColor = isMale ? MALE_COLOR : FEMALE_COLOR;
    const imageSource = resolveImageSource(person.profileImage);
    const fullName = getFullName(person);
    const isRoot = depth === 0;

    const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null;
    const deathYear = !person.isAlive && person.deathDate ? new Date(person.deathDate).getFullYear() : null;
    const yearsText =
      birthYear !== null || deathYear !== null
        ? `${birthYear ?? '؟'}${deathYear !== null ? ` – ${deathYear}` : ''}`
        : null;

    const handleCardPress = () => {
      if (hasChildren) {
        toggleExpand(person.id);
      } else {
        openDetails(person.id);
      }
    };

    return (
      <View className="flex-row">
        {renderGuides(item.guideLines, depth)}
        <View className="flex-1" style={{ paddingVertical: 2, paddingLeft: 8, paddingRight: 8 }}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleCardPress}
            className={`flex-row items-center rounded-xl border p-2 shadow-sm ${
              isRoot
                ? 'bg-card dark:bg-card-dark border-primary/40'
                : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
            }`}
          >
            {hasChildren ? (
            <TouchableOpacity
              onPress={() => toggleExpand(person.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full items-center justify-center mr-1.5"
              style={{ backgroundColor: genderColor + '1A' }}
              testID={`person-toggle-${person.id}`}
            >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={genderColor}
                />
              </TouchableOpacity>
            ) : (
              <View className="w-7 mr-1.5" />
            )}

            <TouchableOpacity
              onPress={() => openDetails(person.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 items-center justify-center"
              testID={`person-info-${person.id}`}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View className="flex-1 items-end mr-2">
              <Text
                numberOfLines={1}
                className={`text-sm font-bold text-right text-text-primary dark:text-text-dark ${
                  person.isAlive ? '' : 'opacity-80'
                }`}
              >
                {fullName}
              </Text>
              <View className="flex-row items-center mt-0.5">
                {!person.isAlive && (
                  <View className="flex-row items-center ml-1.5">
                    <Ionicons name="skull" size={10} color="#ef4444" />
                    <Text className="text-[9px] text-red-500 font-semibold ml-0.5">
                      {isMale ? 'متوفي' : 'متوفاة'}
                    </Text>
                  </View>
                )}
                {yearsText && (
                  <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary">
                    {yearsText}
                  </Text>
                )}
              </View>
              {childCount > 0 && (
                <View
                  className="flex-row items-center mt-0.5 self-end rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: genderColor + '18' }}
                >
                  <Ionicons name="people" size={10} color={genderColor} />
                  <Text className="text-[9px] font-bold ml-0.5" style={{ color: genderColor }}>
                    {childCount}
                  </Text>
                </View>
              )}
            </View>

            <View
              className="w-9 h-9 rounded-full overflow-hidden items-center justify-center"
              style={{ backgroundColor: genderColor }}
            >
              {imageSource ? (
                <Image source={imageSource} style={{ width: '100%', height: '100%' } as any} />
              ) : (
                <Ionicons name={isMale ? 'male' : 'female'} size={22} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center pt-24 px-8">
      <MaterialCommunityIcons name="family-tree" size={64} color={colors.textSecondary} />
      <Text className="mt-4 text-base text-center text-text-secondary dark:text-text-dark-secondary">
        لا توجد بيانات لعرض الشجرة
      </Text>
    </View>
  );

  if (isLoading && persons.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-primary dark:bg-bg-dark">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary">
          جاري تحميل الشجرة...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-bg-primary dark:bg-bg-dark">
        <Stack.Screen options={{ headerShown: false }} />
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
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary dark:text-text-dark">
            شجرة العائلة
          </Text>
          <View className="w-10" />
        </View>

        <Text className="text-xs text-center text-text-secondary dark:text-text-dark-secondary mb-3">
          اضغط على أي شخص لعرض أبنائه، وأيقونة المعلومات لعرض التفاصيل
        </Text>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View className="flex-row items-center rounded-full bg-card dark:bg-card-dark border border-border dark:border-border-dark px-3 py-1.5 ml-2">
              <Ionicons name="people" size={13} color="#0d5c63" />
              <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary ml-1.5">
                الأعضاء
              </Text>
              <Text className="text-[12px] font-bold text-text-primary dark:text-text-dark ml-1">
                {persons.length}
              </Text>
            </View>
            <View className="flex-row items-center rounded-full bg-card dark:bg-card-dark border border-border dark:border-border-dark px-3 py-1.5">
              <MaterialCommunityIcons name="tree" size={13} color="#b8860b" />
              <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary ml-1.5">
                الجذور
              </Text>
              <Text className="text-[12px] font-bold text-text-primary dark:text-text-dark ml-1">
                {roots.length}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={expandAll}
              activeOpacity={0.7}
              className="flex-row items-center rounded-full bg-primary/10 px-3 py-1.5 ml-2"
            >
              <MaterialCommunityIcons name="unfold-more-horizontal" size={14} color={colors.primary} />
              <Text className="text-[10px] font-bold text-primary ml-1">توسيع الكل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={collapseAll}
              activeOpacity={0.7}
              className="flex-row items-center rounded-full bg-primary/10 px-3 py-1.5"
            >
              <MaterialCommunityIcons name="unfold-less-horizontal" size={14} color={colors.primary} />
              <Text className="text-[10px] font-bold text-primary ml-1">طي الكل</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="search" size={18} color={colors.textSecondary} className="mr-2" />
          <View className="flex-1 relative">
            <TextInput
              className="p-2.5 pr-9 rounded-xl text-sm border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
              placeholder="بحث بالإسم الثلاثي"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5"
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {searchMatchIds && (
          <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-2 text-center">
            {searchMatchIds.size} نتيجة بحث
          </Text>
        )}
      </View>

      <FlatList
        data={visibleNodes}
        renderItem={renderItem}
        keyExtractor={item => item.person.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </View>
  );
}
