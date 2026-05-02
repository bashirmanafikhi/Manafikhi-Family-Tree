import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Person } from '../types';
import { imageMap } from '../imageMap';

interface TreeNode {
  person: Person;
  children: TreeNode[];
  generation: number;
}

function resolveImageSource(imagePath: string | undefined): any {
  if (!imagePath) return null;
  return imageMap[imagePath] || null;
}

interface MiniFamilyTreeProps {
  person: Person;
  allPersons: Person[];
}

export default function MiniFamilyTree({ person, allPersons }: MiniFamilyTreeProps) {
  const { colors } = useTheme();

  const getAncestors = (p: Person, maxGen = 2): TreeNode => {
    const buildNode = (curr: Person, gen: number): TreeNode => {
      const father = allPersons.find(ap => ap.id === curr.fatherId);
      const mother = allPersons.find(ap => ap.id === curr.motherId);
      const childrenNodes: TreeNode[] = [];
      if (gen < maxGen) {
        if (father) childrenNodes.push(buildNode(father, gen + 1));
        if (mother) childrenNodes.push(buildNode(mother, gen + 1));
      }
      return { person: curr, children: childrenNodes, generation: gen };
    };
    return buildNode(p, 0);
  };

  const getDescendants = (p: Person, maxGen = 2): TreeNode => {
    const buildNode = (curr: Person, gen: number): TreeNode => {
      const children = allPersons.filter(ap => ap.fatherId === curr.id || ap.motherId === curr.id);
      const childrenNodes = gen < maxGen ? children.map(c => buildNode(c, gen + 1)) : [];
      return { person: curr, children: childrenNodes, generation: gen };
    };
    return buildNode(p, 0);
  };

  const ancestorTree = getAncestors(person);
  const descendantTree = getDescendants(person);

  const renderNode = (node: TreeNode, isMain = false) => {
    const p = node.person;
    const isMale = p.gender === 'MALE';
    const imageSource = resolveImageSource(p.profileImage);
    const isDeceased = !p.isAlive;

    return (
      <TouchableOpacity
        key={p.id}
        onPress={() => router.replace(`/person/${encodeURIComponent(p.id)}`)}
        className="items-center mx-2"
        activeOpacity={0.7}
      >
        <View 
          className={`rounded-2xl overflow-hidden border-2 ${isMain ? 'w-20 h-20' : 'w-14 h-14'} ${
            isDeceased ? 'border-gray-400' : (isMale ? 'border-[#5b9]' : 'border-[#bc6798]')
          }`}
        >
          {imageSource ? (
            <Image source={imageSource} className={`w-full h-full ${isDeceased ? 'opacity-60' : ''}`} />
          ) : (
            <View className={`w-full h-full items-center justify-center ${isMale ? 'bg-[#5b9]/20' : 'bg-[#bc6798]/20'}`}>
              <Ionicons name={isMale ? 'male' : 'female'} size={isMain ? 32 : 24} color={isMale ? '#5b9' : '#bc6798'} />
            </View>
          )}
        </View>
        <Text 
          className={`mt-1 font-bold text-center text-text-primary dark:text-text-dark ${isMain ? 'text-sm' : 'text-[10px]'}`}
          numberOfLines={1}
          style={{ maxWidth: isMain ? 80 : 60 }}
        >
          {p.firstName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mt-10">
      <View className="flex-row items-center mb-6 px-6">
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="git-branch" size={18} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-text-primary dark:text-text-dark">شجرة العائلة</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center' }}
      >
        {/* Ancestors */}
        <View className="flex-row items-center">
          {ancestorTree.children.map(child => renderNode(child))}
          {ancestorTree.children.length > 0 && (
            <View className="w-8 h-[2px] bg-border/30 dark:border-border-dark/30 mx-1" />
          )}
        </View>

        {/* Current Person */}
        {renderNode(ancestorTree, true)}

        {/* Descendants */}
        <View className="flex-row items-center">
          {descendantTree.children.length > 0 && (
            <View className="w-8 h-[2px] bg-border/30 dark:border-border-dark/30 mx-1" />
          )}
          {descendantTree.children.map(child => renderNode(child))}
        </View>
      </ScrollView>
      <Text className="text-[10px] text-text-secondary dark:text-text-dark-secondary text-center mt-4">
        تصفح الأجيال القريبة • اسحب لليمين واليسار
      </Text>
    </View>
  );
}
