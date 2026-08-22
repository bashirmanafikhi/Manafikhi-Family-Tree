import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations, Person } from '../src/types';
import { imageMap } from '../src/imageMap';

const { width } = Dimensions.get('window');
const MALE_COLOR = '#55bb99';
const FEMALE_COLOR = '#bc6798';

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

function resolveImageSource(imagePath: string | undefined): any {
  if (!imagePath) return null;
  return imageMap[imagePath] || null;
}

interface KinshipResult {
  personA: PersonWithRelations;
  personB: PersonWithRelations;
  commonAncestor: PersonWithRelations;
  pathA: PersonWithRelations[];
  pathB: PersonWithRelations[];
  title: string;
  subtitle: string;
  fromA: string;
  fromB: string;
}

function findKinship(
  personA: PersonWithRelations,
  personB: PersonWithRelations,
  personMap: Map<string, PersonWithRelations>
): KinshipResult | null {
  const getAncestors = (startId: string) => {
    const visited = new Map<string, number>();
    const parentOf = new Map<string, string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.set(id, depth);
      const p = personMap.get(id);
      if (!p) continue;
      if (p.fatherId) {
        if (!visited.has(p.fatherId)) {
          parentOf.set(p.fatherId, id);
          queue.push({ id: p.fatherId, depth: depth + 1 });
        }
      }
      if (p.motherId) {
        if (!visited.has(p.motherId)) {
          parentOf.set(p.motherId, id);
          queue.push({ id: p.motherId, depth: depth + 1 });
        }
      }
    }
    visited.delete(startId);
    return { ancestors: visited, parentOf };
  };

  const getPath = (startId: string, targetId: string, parentOf: Map<string, string>): PersonWithRelations[] => {
    const path: PersonWithRelations[] = [];
    let current: string | undefined = targetId;
    while (current && current !== startId) {
      const p = personMap.get(current);
      if (p) path.unshift(p);
      current = parentOf.get(current);
    }
    const start = personMap.get(startId);
    if (start) path.unshift(start);
    return path;
  };

  const findBestCommon = (
    ancX: Map<string, number>,
    ancY: Map<string, number>
  ): Array<{ id: string; depthX: number; depthY: number }> => {
    const common: Array<{ id: string; depthX: number; depthY: number }> = [];
    for (const [id, depthX] of ancX) {
      const depthY = ancY.get(id);
      if (depthY !== undefined) {
        common.push({ id, depthX, depthY });
      }
    }
    common.sort((a, b) => (a.depthX + a.depthY) - (b.depthX + b.depthY) || Math.abs(a.depthX - a.depthY) - Math.abs(b.depthX - b.depthY));
    return common;
  };

  // 1) Direct blood search
  const ancA = getAncestors(personA.id);
  const ancB = getAncestors(personB.id);
  const directCommon = findBestCommon(ancA.ancestors, ancB.ancestors);

  if (directCommon.length > 0) {
    const best = directCommon[0];
    const ca = personMap.get(best.id);
    if (!ca) return null;
    const pathA = getPath(personA.id, best.id, ancA.parentOf);
    const pathB = getPath(personB.id, best.id, ancB.parentOf);
    const { title, subtitle, fromA, fromB } = computeTitle(personA, personB, pathA, pathB, ca);
    return { personA, personB, commonAncestor: ca, pathA, pathB, title, subtitle, fromA, fromB };
  }

  // 2) Spouse fallback: try A's spouses and B's spouses
  const spousesA = personA.spouses || [];
  const spousesB = personB.spouses || [];

  type SpouseMatch = {
    spouse: Person;
    spouseAnc: { ancestors: Map<string, number>; parentOf: Map<string, string> };
    common: Array<{ id: string; depthX: number; depthY: number }>;
  };

  const findSpouseMatch = (
    spouses: Person[],
    targetAnc: Map<string, number>
  ): SpouseMatch | null => {
    let bestMatch: SpouseMatch | null = null;
    for (const spouse of spouses) {
      const spouseAnc = getAncestors(spouse.id);
      const common = findBestCommon(spouseAnc.ancestors, targetAnc);
      if (common.length > 0) {
        if (!bestMatch || common[0].depthX + common[0].depthY < bestMatch.common[0].depthX + bestMatch.common[0].depthY) {
          bestMatch = { spouse, spouseAnc, common };
        }
      }
    }
    return bestMatch;
  };

  // Try A's spouses connected to B's blood
  const matchA = findSpouseMatch(spousesA, ancB.ancestors);
  // Try B's spouses connected to A's blood
  const matchB = findSpouseMatch(spousesB, ancA.ancestors);

  let bestSpouseMatch: SpouseMatch | null = null;
  let viaPerson: 'A' | 'B' = 'A';

  if (matchA && matchB) {
    if (matchA.common[0].depthX + matchA.common[0].depthY <= matchB.common[0].depthX + matchB.common[0].depthY) {
      bestSpouseMatch = matchA;
      viaPerson = 'A';
    } else {
      bestSpouseMatch = matchB;
      viaPerson = 'B';
    }
  } else if (matchA) {
    bestSpouseMatch = matchA;
    viaPerson = 'A';
  } else if (matchB) {
    bestSpouseMatch = matchB;
    viaPerson = 'B';
  }

  if (bestSpouseMatch) {
    const { spouse, spouseAnc, common } = bestSpouseMatch;
    const best = common[0];
    const ca = personMap.get(best.id);
    if (!ca) return null;

    const spousePath = viaPerson === 'A'
      ? getPath(personA.id, best.id, spouseAnc.parentOf)
      : getPath(personB.id, best.id, spouseAnc.parentOf);

    const pathA = viaPerson === 'A'
      ? [personA, ...getPath(spouse.id, best.id, spouseAnc.parentOf)]
      : getPath(personA.id, best.id, ancA.parentOf);

    const pathB = viaPerson === 'B'
      ? [personB, ...getPath(spouse.id, best.id, spouseAnc.parentOf)]
      : getPath(personB.id, best.id, ancB.parentOf);

    const spouseRel = viaPerson === 'A'
      ? (personA.gender === 'MALE' ? 'زوجته' : 'زوجه')
      : (personB.gender === 'MALE' ? 'زوجته' : 'زوجه');

    const caRel = best.depthX === 1
      ? (spouse.gender === 'MALE' ? 'أب' : 'أم')
      : best.depthX === 2
      ? (spouse.gender === 'MALE' ? 'جد' : 'جدة')
      : `سليل الجيل ${best.depthX}`;

    const titleVia = viaPerson === 'A'
      ? `${personA.firstName} (${spouseRel} ${spouse.firstName}) – ${caRel} ${personB.firstName}`
      : `${personB.firstName} (${spouseRel} ${spouse.firstName}) – ${caRel} ${personA.firstName}`;

    const subtitleVia = viaPerson === 'A'
      ? `زوج/زوجة ${spouse.firstName} من عائلة ${ca.firstName}`
      : `زوج/زوجة ${spouse.firstName} من عائلة ${ca.firstName}`;

    return {
      personA,
      personB,
      commonAncestor: ca,
      pathA,
      pathB,
      title: `أقارب بالزواج (${caRel})`,
      subtitle: subtitleVia,
      fromA: viaPerson === 'A' ? `${personA.firstName} متزوج من عائلة ${ca.firstName}` : `${personA.firstName} – أقارب دم مع ${ca.firstName}`,
      fromB: viaPerson === 'B' ? `${personB.firstName} متزوج من عائلة ${ca.firstName}` : `${personB.firstName} – أقارب دم مع ${ca.firstName}`,
    };
  }

  return null;
}

function computeTitle(
  personA: PersonWithRelations,
  personB: PersonWithRelations,
  pathA: PersonWithRelations[],
  pathB: PersonWithRelations[],
  ca: PersonWithRelations
): { title: string; subtitle: string; fromA: string; fromB: string } {
  const gA = pathA.length - 1;
  const gB = pathB.length - 1;
  const nameA = personA.firstName;
  const nameB = personB.firstName;
  const nameCA = ca.firstName;
  const isMaleA = personA.gender === 'MALE';
  const isMaleB = personB.gender === 'MALE';
  const isMaleCA = ca.gender === 'MALE';

  if (gA === 0 && gB === 0) {
    return { title: 'نفس الشخص', subtitle: 'هما شخص واحد', fromA: '-', fromB: '-' };
  }

  if (gA === 0) {
    const genTerm = ['', isMaleA ? 'أب' : 'أم', isMaleA ? 'جد' : 'جدة', isMaleA ? 'جد الجد' : 'جدة الجدة'];
    const term = gB <= 3 ? (genTerm[gB] || `سليل الجيل ${gB}`) : `سليل الجيل ${gB}`;
    const bTerm = isMaleB ? 'ابن' : 'بنت';
    return {
      title: term,
      subtitle: `${nameB} ${bTerm} ${term} ${nameA}`,
      fromA: `${nameA} هو ${term} ${nameB}`,
      fromB: `${nameB} ${bTerm} ${nameA}`,
    };
  }

  if (gB === 0) {
    const genTerm = ['', isMaleB ? 'أب' : 'أم', isMaleB ? 'جد' : 'جدة', isMaleB ? 'جد الجد' : 'جدة الجدة'];
    const term = gA <= 3 ? (genTerm[gA] || `سليل الجيل ${gA}`) : `سليل الجيل ${gA}`;
    const aTerm = isMaleA ? 'ابن' : 'بنت';
    return {
      title: term,
      subtitle: `${nameA} ${aTerm} ${term} ${nameB}`,
      fromA: `${nameA} ${aTerm} ${nameB}`,
      fromB: `${nameB} هو ${term} ${nameA}`,
    };
  }

  if (gA === 1 && gB === 1) {
    const shareFather = pathA[0].fatherId === pathB[0].fatherId;
    const shareMother = pathA[0].motherId === pathB[0].motherId;
    if (shareFather && shareMother) {
      const term = isMaleA ? 'أخ شقيق' : 'أخت شقيقة';
      return {
        title: term,
        subtitle: `${nameA} و${nameB} إخوة شقيقان`,
        fromA: `${nameB} ${isMaleB ? 'أخوه' : 'أخته'} الشقيق`,
        fromB: `${nameA} ${isMaleA ? 'أخوه' : 'أخته'} الشقيق`,
      };
    }
    const side = shareFather ? 'الأب' : 'الأم';
    const term = isMaleA ? `أخ نصف` : `أخت نصف`;
    return {
      title: term,
      subtitle: `${nameA} و${nameB} أخوة نصف من ${side}`,
      fromA: `${nameB} ${isMaleB ? 'أخوه' : 'أخته'} النصف`,
      fromB: `${nameA} ${isMaleA ? 'أخوه' : 'أخته'} النصف`,
    };
  }

  if (gA === 1 && gB >= 2) {
    const intermediate = pathB[1];
    const isPaternal = intermediate.id === pathB[0].fatherId;
    let term: string;
    let bTerm: string;
    if (isPaternal) {
      term = isMaleA ? 'عم' : 'عمة';
      bTerm = isMaleB ? 'ابن العم' : 'بنت العم';
    } else {
      term = isMaleA ? 'خال' : 'خالة';
      bTerm = isMaleB ? 'ابن الخال' : 'بنت الخال';
    }
    return {
      title: term,
      subtitle: `${nameA} ${term} ${nameB}`,
      fromA: `${nameB} ${bTerm}`,
      fromB: `${nameA} ${term}ه`,
    };
  }

  if (gB === 1 && gA >= 2) {
    const intermediate = pathA[1];
    const isPaternal = intermediate.id === pathA[0].fatherId;
    let term: string;
    let aTerm: string;
    if (isPaternal) {
      term = isMaleB ? 'عم' : 'عمة';
      aTerm = isMaleA ? 'ابن العم' : 'بنت العم';
    } else {
      term = isMaleB ? 'خال' : 'خالة';
      aTerm = isMaleA ? 'ابن الخال' : 'بنت الخال';
    }
    return {
      title: term,
      subtitle: `${nameB} ${term} ${nameA}`,
      fromA: `${nameA} ${aTerm}`,
      fromB: `${nameB} ${term}ه`,
    };
  }

  if (gA === 2 && gB === 2) {
    const intermediateB = pathB[1];
    const isPaternal = intermediateB.id === pathB[0].fatherId;
    let aTerm: string;
    let bTerm: string;
    if (isPaternal) {
      const intermediateA = pathA[1];
      aTerm = intermediateA.gender === 'MALE' ? 'ابن العم' : 'ابن العمة';
      bTerm = isMaleB ? 'ابن العم' : 'بنت العم';
    } else {
      const intermediateA = pathA[1];
      aTerm = intermediateA.gender === 'MALE' ? 'ابن الخال' : 'ابن الخالة';
      bTerm = isMaleB ? 'ابن الخال' : 'بنت الخال';
    }
    return {
      title: bTerm,
      subtitle: `${nameA} و${nameB} أبناء عمومة`,
      fromA: `${nameB} ${bTerm}`,
      fromB: `${nameA} ${aTerm}`,
    };
  }

  const degree = Math.max(gA, gB) - 1;
  return {
    title: `أقارب من الدرجة ${degree}`,
    subtitle: `${nameA} و${nameB} يشتركان في الجد ${nameCA}`,
    fromA: `${nameB} قريب${isMaleB ? '' : 'ة'} من الدرجة ${degree}`,
    fromB: `${nameA} قريب${isMaleA ? '' : 'ة'} من الدرجة ${degree}`,
  };
}

const PAGE_SIZE = 30;

export default function KinshipScreen() {
  const { persons, isLoading, error } = useFamily();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [personA, setPersonA] = useState<PersonWithRelations | null>(null);
  const [personB, setPersonB] = useState<PersonWithRelations | null>(null);
  const [result, setResult] = useState<KinshipResult | null>(null);
  const [pickerVisible, setPickerVisible] = useState<'A' | 'B' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerPage, setPickerPage] = useState(1);

  const personMap = useMemo(() => {
    const map = new Map<string, PersonWithRelations>();
    persons.forEach(p => map.set(p.id, p));
    return map;
  }, [persons]);

  const filteredPickerPersons = useMemo(() => {
    const excludeId = pickerVisible === 'A' ? personB?.id : personA?.id;
    let list = persons.filter(p => p.id !== excludeId);
    if (searchQuery.trim()) {
      const q = normalizeArabic(searchQuery.trim());
      list = list.filter(p => {
        const full = normalizeArabic(`${p.firstName} ${p.lastName || ''}`);
        const fatherName = p.father ? normalizeArabic(p.father.firstName) : '';
        const fullNameWithFather = normalizeArabic(`${p.firstName} ${fatherName}`.trim());
        return full.includes(q) || fullNameWithFather.includes(q) || fatherName.includes(q);
      });
    }
    return list;
  }, [persons, searchQuery, pickerVisible, personA, personB]);

  const paginatedPickerPersons = useMemo(
    () => filteredPickerPersons.slice(0, pickerPage * PAGE_SIZE),
    [filteredPickerPersons, pickerPage]
  );

  const handleSelectPerson = useCallback((p: PersonWithRelations) => {
    if (pickerVisible === 'A') {
      setPersonA(p);
    } else {
      setPersonB(p);
    }
    setPickerVisible(null);
    setSearchQuery('');
    setPickerPage(1);
  }, [pickerVisible]);

  const handleSwap = useCallback(() => {
    setPersonA(personB);
    setPersonB(personA);
    setResult(null);
  }, [personA, personB]);

  const [searched, setSearched] = useState(false);

  const handleConfirm = useCallback(() => {
    if (!personA || !personB) return;
    const r = findKinship(personA, personB, personMap);
    setResult(r);
    setSearched(true);
  }, [personA, personB, personMap]);

  const handleNewSearch = useCallback(() => {
    setResult(null);
    setSearched(false);
    setPersonA(null);
    setPersonB(null);
  }, []);

  const canConfirm = personA !== null && personB !== null && personA.id !== personB.id;

  const renderPickerPerson = ({ item }: { item: PersonWithRelations }) => {
    const isMale = item.gender === 'MALE';
    const genderColor = isMale ? MALE_COLOR : FEMALE_COLOR;
    const imageSource = resolveImageSource(item.profileImage);
    const fullName = getFullName(item);
    const fatherName = item.father ? `${item.father.firstName}` : '';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelectPerson(item)}
        className="flex-row items-center p-3 border-b border-border/30 dark:border-border-dark/30"
      >
        <View
          className="w-10 h-10 rounded-full overflow-hidden items-center justify-center mr-3"
          style={{ backgroundColor: genderColor }}
        >
          {imageSource ? (
            <Image source={imageSource} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" />
          ) : (
            <Ionicons name={isMale ? 'male' : 'female'} size={20} color="#fff" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-right text-text-primary dark:text-text-dark" numberOfLines={1}>
            {fullName}
          </Text>
          {fatherName ? (
            <Text className="text-xs text-right text-text-secondary dark:text-text-dark-secondary" numberOfLines={1}>
              {fatherName}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (isLoading && persons.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-primary dark:bg-bg-dark">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary">جاري التحميل...</Text>
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
          <TouchableOpacity onPress={() => result ? handleNewSearch() : router.back()} className="p-2" activeOpacity={0.7}>
            <Ionicons name={result ? 'arrow-back' : 'arrow-back'} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary dark:text-text-dark">
            {result ? 'نتيجة البحث' : 'شو بيقربني؟'}
          </Text>
          <View className="w-10" />
        </View>
        {!result && (
          <Text className="text-xs text-center text-text-secondary dark:text-text-dark-secondary">
            اختر شخصين لمعرفة صلة قرابتهما
          </Text>
        )}
      </View>

      {!result ? (
        <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <MaterialCommunityIcons name="account-group" size={36} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-center text-text-primary dark:text-text-dark mb-1">
              شو بيقربني؟
            </Text>
            <Text className="text-sm text-center text-text-secondary dark:text-text-dark-secondary">
              اختر شخصين لمعرفة صلة القرابة بينهما
            </Text>
          </View>

          <View className="flex-row items-center justify-center mb-8">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPickerVisible('A')}
              className="flex-1 mx-1 rounded-2xl border-2 border-dashed p-4 items-center"
              style={{ borderColor: personA ? (personA.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) : colors.border, backgroundColor: personA ? (personA.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) + '0A' : 'transparent' }}
            >
              {personA ? (
                <>
                  <View
                    className="w-14 h-14 rounded-full overflow-hidden items-center justify-center mb-2"
                    style={{ backgroundColor: personA.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR }}
                  >
                    {resolveImageSource(personA.profileImage) ? (
                      <Image source={resolveImageSource(personA.profileImage)} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" />
                    ) : (
                      <Ionicons name={personA.gender === 'MALE' ? 'male' : 'female'} size={26} color="#fff" />
                    )}
                  </View>
                  <Text className="text-sm font-bold text-center text-text-primary dark:text-text-dark" numberOfLines={1}>
                    {personA.firstName}
                  </Text>
                  <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-0.5">الشخص الأول</Text>
                </>
              ) : (
                <>
                  <Ionicons name="person-add" size={32} color={colors.textSecondary} />
                  <Text className="text-sm font-bold text-text-secondary dark:text-text-dark-secondary mt-2">الشخص الأول</Text>
                  <Text className="text-[10px] text-text-secondary/60 dark:text-text-dark-secondary/60">اضغط للاختيار</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSwap}
              className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mx-1"
              disabled={!personA && !personB}
            >
              <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPickerVisible('B')}
              className="flex-1 mx-1 rounded-2xl border-2 border-dashed p-4 items-center"
              style={{ borderColor: personB ? (personB.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) : colors.border, backgroundColor: personB ? (personB.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) + '0A' : 'transparent' }}
            >
              {personB ? (
                <>
                  <View
                    className="w-14 h-14 rounded-full overflow-hidden items-center justify-center mb-2"
                    style={{ backgroundColor: personB.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR }}
                  >
                    {resolveImageSource(personB.profileImage) ? (
                      <Image source={resolveImageSource(personB.profileImage)} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" />
                    ) : (
                      <Ionicons name={personB.gender === 'MALE' ? 'male' : 'female'} size={26} color="#fff" />
                    )}
                  </View>
                  <Text className="text-sm font-bold text-center text-text-primary dark:text-text-dark" numberOfLines={1}>
                    {personB.firstName}
                  </Text>
                  <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-0.5">الشخص الثاني</Text>
                </>
              ) : (
                <>
                  <Ionicons name="person-add" size={32} color={colors.textSecondary} />
                  <Text className="text-sm font-bold text-text-secondary dark:text-text-dark-secondary mt-2">الشخص الثاني</Text>
                  <Text className="text-[10px] text-text-secondary/60 dark:text-text-dark-secondary/60">اضغط للاختيار</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {personA && personB && personA.id === personB.id && (
            <View className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700">
              <View className="flex-row items-center justify-center">
                <Ionicons name="warning" size={16} color="#d97706" />
                <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400 mr-2">
                  يجب اختيار شخصين مختلفين
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleConfirm}
            disabled={!canConfirm}
            className={`mx-4 py-4 rounded-2xl items-center flex-row justify-center ${
              canConfirm ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <Ionicons name="search" size={22} color={canConfirm ? '#fff' : '#999'} />
            <Text className={`text-lg font-bold ml-2 ${canConfirm ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              موافق
            </Text>
          </TouchableOpacity>

          {searched && !result && personA && personB && (
            <View className="mx-4 mt-4 p-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark items-center">
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text className="mt-3 text-base font-bold text-text-primary dark:text-text-dark text-center">
                لا توجد صلة قرابة دموية
              </Text>
              <Text className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary text-center">
                لم يتم العثور على جد مشترك بين {personA.firstName} و{personB.firstName}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-6">
            <View className="rounded-3xl overflow-hidden mb-6" style={{ backgroundColor: colors.primary }}>
              <View className="px-5 py-5">
                <View className="flex-row items-center justify-center mb-3">
                  <Ionicons name="ribbon" size={22} color="#fff" />
                  <Text className="text-lg font-bold text-white mr-2">{result!.title}</Text>
                </View>
                <Text className="text-sm text-center text-white/80 mb-3">{result!.subtitle}</Text>
                <View className="flex-row justify-between">
                  <View className="flex-1 mx-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Text className="text-[11px] text-white/60 text-center mb-1">{result!.personA.firstName}</Text>
                    <Text className="text-xs font-bold text-white text-center" numberOfLines={2}>{result!.fromA}</Text>
                  </View>
                  <View className="flex-1 mx-1 rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Text className="text-[11px] text-white/60 text-center mb-1">{result!.personB.firstName}</Text>
                    <Text className="text-xs font-bold text-white text-center" numberOfLines={2}>{result!.fromB}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text className="text-lg font-bold text-text-primary dark:text-text-dark mb-4 text-right">
              مخطط القرابة
            </Text>

            <View className="rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-4 mb-6 shadow-sm">
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/person/${encodeURIComponent(result!.commonAncestor.id)}`)} className="items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mb-2">
                  <Ionicons name="star" size={24} color="#b8860b" />
                </View>
                <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary mb-1">الجد المشترك</Text>
                <Text className="text-sm font-bold text-text-primary dark:text-text-dark">
                  {getFullName(result!.commonAncestor)}
                </Text>
                {result!.commonAncestor.birthDate && (
                  <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary">
                    {new Date(result!.commonAncestor.birthDate).getFullYear()}
                    {!result!.commonAncestor.isAlive && result!.commonAncestor.deathDate
                      ? ` – ${new Date(result!.commonAncestor.deathDate).getFullYear()}`
                      : ''}
                  </Text>
                )}
              </TouchableOpacity>

              {(() => {
                const maxGen = Math.max(result!.pathA.length, result!.pathB.length);
                const rows: React.ReactNode[] = [];
                const openPerson = (id: string) => router.push(`/person/${encodeURIComponent(id)}`);
                const bloodColor = MALE_COLOR + '50';
                const marriageColor = '#e74c8b80';

                const isMarriedTo = (a: PersonWithRelations, b: PersonWithRelations): boolean => {
                  return (a.spouses || []).some(s => s.id === b.id) || (b.spouses || []).some(s => s.id === a.id);
                };

                for (let i = 1; i < maxGen - 1; i++) {
                  const leftIdx = result!.pathA.length - 1 - i;
                  const rightIdx = result!.pathB.length - 1 - i;
                  const leftPerson = leftIdx > 0 ? result!.pathA[leftIdx] : null;
                  const rightPerson = rightIdx > 0 ? result!.pathB[rightIdx] : null;

                  rows.push(
                    <View key={`connector-${i}`} className="flex-row justify-center" style={{ height: 16 }}>
                      <View style={{ width: 2, height: 16, backgroundColor: bloodColor }} />
                    </View>
                  );

                  rows.push(
                    <View key={`row-${i}`} className="flex-row justify-between items-center mb-1">
                      <View className="flex-1 items-center mx-1">
                        {leftPerson ? (
                          <PersonMiniCard person={leftPerson} onPress={() => openPerson(leftPerson.id)} />
                        ) : (
                          <View style={{ height: 50 }} />
                        )}
                      </View>
                      <View className="items-center justify-center" style={{ width: 36, height: 50 }}>
                        {leftPerson && rightPerson && isMarriedTo(leftPerson, rightPerson) ? (
                          <View style={{ width: 36, height: '100%', position: 'relative' }}>
                            <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: marriageColor, transform: [{ translateY: -1 }] }} />
                            <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -14 }], width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: marriageColor }}>
                              <Ionicons name="heart" size={11} color="#e74c8b" />
                            </View>
                          </View>
                        ) : leftPerson && rightPerson ? (
                          <View style={{ width: 2, height: '100%', backgroundColor: colors.border }} />
                        ) : null}
                      </View>
                      <View className="flex-1 items-center mx-1">
                        {rightPerson ? (
                          <PersonMiniCard person={rightPerson} onPress={() => openPerson(rightPerson.id)} />
                        ) : (
                          <View style={{ height: 50 }} />
                        )}
                      </View>
                    </View>
                  );
                }

                rows.push(
                  <View key="connector-final" className="flex-row justify-center" style={{ height: 16 }}>
                    <View style={{ width: 2, height: 16, backgroundColor: bloodColor }} />
                  </View>
                );

                const personAMarriedToB = isMarriedTo(result!.personA, result!.personB);

                rows.push(
                  <View key="final-row" className="flex-row justify-between items-start">
                    <View className="flex-1 items-center mx-1">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push(`/person/${encodeURIComponent(result!.personA.id)}`)}
                        className="rounded-2xl border-2 p-2.5 items-center w-full"
                        style={{ borderColor: result!.personA.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR, backgroundColor: (result!.personA.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) + '08' }}
                      >
                        {(() => {
                          const img = resolveImageSource(result!.personA.profileImage);
                          const isMale = result!.personA.gender === 'MALE';
                          return (
                            <View
                              className="w-9 h-9 rounded-full overflow-hidden items-center justify-center mb-1"
                              style={{ backgroundColor: isMale ? MALE_COLOR : FEMALE_COLOR }}
                            >
                              {img ? <Image source={img} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" /> :
                                <Ionicons name={isMale ? 'male' : 'female'} size={18} color="#fff" />}
                            </View>
                          );
                        })()}
                        <Text className="text-[11px] font-bold text-text-primary dark:text-text-dark" numberOfLines={1}>
                          {result!.personA.firstName}
                        </Text>
                        <Text className="text-[9px] text-text-secondary dark:text-text-dark-secondary">الأول</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="items-center justify-center" style={{ width: 40, height: 70, paddingTop: 15 }}>
                      {personAMarriedToB ? (
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e74c8b' }}>
                          <Ionicons name="heart" size={16} color="#e74c8b" />
                        </View>
                      ) : (
                        <View style={{ width: 2, height: 40, backgroundColor: colors.border }} />
                      )}
                    </View>
                    <View className="flex-1 items-center mx-1">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push(`/person/${encodeURIComponent(result!.personB.id)}`)}
                        className="rounded-2xl border-2 p-2.5 items-center w-full"
                        style={{ borderColor: result!.personB.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR, backgroundColor: (result!.personB.gender === 'MALE' ? MALE_COLOR : FEMALE_COLOR) + '08' }}
                      >
                        {(() => {
                          const img = resolveImageSource(result!.personB.profileImage);
                          const isMale = result!.personB.gender === 'MALE';
                          return (
                            <View
                              className="w-9 h-9 rounded-full overflow-hidden items-center justify-center mb-1"
                              style={{ backgroundColor: isMale ? MALE_COLOR : FEMALE_COLOR }}
                            >
                              {img ? <Image source={img} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" /> :
                                <Ionicons name={isMale ? 'male' : 'female'} size={18} color="#fff" />}
                            </View>
                          );
                        })()}
                        <Text className="text-[11px] font-bold text-text-primary dark:text-text-dark" numberOfLines={1}>
                          {result!.personB.firstName}
                        </Text>
                        <Text className="text-[9px] text-text-secondary dark:text-text-dark-secondary">الثاني</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );

                return rows;
              })()}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNewSearch}
              className="mx-0 py-4 rounded-2xl items-center flex-row justify-center bg-primary/10 border border-primary"
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text className="text-base font-bold ml-2" style={{ color: colors.primary }}>بحث جديد</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal visible={pickerVisible !== null} animationType="slide" transparent>
        <View className="flex-1 bg-bg-primary dark:bg-bg-dark" style={{ paddingTop: insets.top }}>
          <View className="px-4 pb-3 border-b border-border dark:border-border-dark bg-surface-light dark:bg-surface-dark">
            <View className="flex-row justify-between items-center mb-3">
              <TouchableOpacity onPress={() => { setPickerVisible(null); setSearchQuery(''); setPickerPage(1); }} className="p-2">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-text-primary dark:text-text-dark">
                {pickerVisible === 'A' ? 'اختر الشخص الأول' : 'اختر الشخص الثاني'}
              </Text>
              <View className="w-10" />
            </View>
            <View className="flex-row items-center">
              <Ionicons name="search" size={20} color={colors.textSecondary} className="mr-3" />
              <TextInput
                className="flex-1 p-3 rounded-xl text-base border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-dark"
                placeholder="بحث بالاسم (مثال: بشير عبد الرحمن)"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => { setSearchQuery(text); setPickerPage(1); }}
                textAlign="right"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setPickerPage(1); }} className="ml-2">
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-2">
              {filteredPickerPersons.length} عضو
            </Text>
          </View>
          <FlatList
            data={paginatedPickerPersons}
            renderItem={renderPickerPerson}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (pickerPage * PAGE_SIZE < filteredPickerPersons.length) {
                setPickerPage(p => p + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center pt-16">
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text className="mt-3 text-base text-text-secondary dark:text-text-dark-secondary">لا توجد نتائج</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

function PersonMiniCard({ person, onPress }: { person: PersonWithRelations; onPress?: () => void }) {
  const isMale = person.gender === 'MALE';
  const genderColor = isMale ? MALE_COLOR : FEMALE_COLOR;
  const imageSource = resolveImageSource(person.profileImage);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress} className="rounded-xl border p-2 items-center w-full" style={{ borderColor: genderColor + '60', backgroundColor: genderColor + '08' }}>
      <View
        className="w-8 h-8 rounded-full overflow-hidden items-center justify-center mb-1"
        style={{ backgroundColor: genderColor }}
      >
        {imageSource ? (
          <Image source={imageSource} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" />
        ) : (
          <Ionicons name={isMale ? 'male' : 'female'} size={16} color="#fff" />
        )}
      </View>
      <Text className="text-[10px] font-bold text-text-primary dark:text-text-dark" numberOfLines={1}>
        {person.firstName}
      </Text>
    </TouchableOpacity>
  );
}
