import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { CanvasNode } from '../src/types';

const NODE_COLORS: Record<string, string> = {
  '0': '#777',
  '1': '#bc6798',
  '2': '#9969b0',
  '3': '#7c8cd6',
  '4': '#5b9',
  '5': '#c95',
  '6': '#e87925'
};

export default function TreeScreen() {
  const { canvasData, persons, isLoading, getPersonForNode } = useFamily();
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const nodeMap = useMemo(() => {
    if (!canvasData) return new Map<string, CanvasNode>();
    const map = new Map<string, CanvasNode>();
    canvasData.nodes.filter(n => n.type === 'text' || n.type === 'file').forEach(n => map.set(n.id, n));
    return map;
  }, [canvasData]);

  const edgeMap = useMemo(() => {
    if (!canvasData) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    canvasData.edges.forEach(e => {
      const children = map.get(e.fromNode) || [];
      children.push(e.toNode);
      map.set(e.fromNode, children);
    });
    return map;
  }, [canvasData]);

  const parentMap = useMemo(() => {
    if (!canvasData) return new Map<string, string>();
    const map = new Map<string, string>();
    canvasData.edges.forEach(e => map.set(e.toNode, e.fromNode));
    return map;
  }, [canvasData]);

  const findAncestors = (nodeId: string): string[] => {
    const ancestors: string[] = [];
    let current = parentMap.get(nodeId);
    while (current) {
      ancestors.push(current);
      current = parentMap.get(current);
    }
    return ancestors;
  };

  const searchResults = useMemo(() => {
    if (!canvasData || !searchQuery.trim()) return { nodesToShow: new Set<string>(), rootIds: [] as string[] };
    const query = searchQuery.toLowerCase();
    const textNodes = canvasData.nodes.filter(n => n.type === 'text' || n.type === 'file');
    const allTextNodeIds = new Set(textNodes.map(n => n.id));

    const matchingNodeIds = new Set<string>();
    const nodesToShow = new Set<string>();

    textNodes.forEach(n => {
      const person = getPersonForNode(n.id);
      const name = n.type === 'file' ? (person?.name || n.file || '') : n.text;
      if (name.toLowerCase().includes(query)) {
        matchingNodeIds.add(n.id);
      }
    });

    matchingNodeIds.forEach(id => {
      nodesToShow.add(id);
      let parentId = parentMap.get(id);
      while (parentId) {
        nodesToShow.add(parentId);
        parentId = parentMap.get(parentId);
      }
    });

    const rootIds = Array.from(nodesToShow).filter(id => {
      const parentId = parentMap.get(id);
      return !parentId || !nodesToShow.has(parentId);
    });

    return { nodesToShow, rootIds };
  }, [canvasData, searchQuery, parentMap]);

  const rootNodeIds = canvasData
    ? (() => {
      const textNodes = canvasData.nodes.filter(n => n.type === 'text' || n.type === 'file');
      const childIds = new Set(canvasData.edges.map(e => e.toNode));
      return textNodes.filter(n => !childIds.has(n.id)).map(n => n.id);
    })()
    : [];

  React.useEffect(() => {
    if (searchQuery.trim() && searchResults.nodesToShow.size > 0) {
      setExpanded(Array.from(searchResults.nodesToShow));
    }
  }, [searchQuery, searchResults]);

  const filteredRootNodeIds = searchQuery.trim() ? searchResults.rootIds : rootNodeIds;

  const toggleNode = (nodeId: string) => {
    setExpanded(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

  const handleNodePress = (nodeId: string) => {
    setSelectedNode(nodeId);
    const person = getPersonForNode(nodeId);
    if (person) router.push(`/person/${encodeURIComponent(person.id)}`);
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (!canvasData) {
    return (
      <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg text-center" style={{ color: '#c00' }}>لم يتم تحميل الشجرة العائلية</Text>
      </View>
    );
  }

  const renderTreeNode = (nodeId: string, level: number, _isLast: boolean, visibleNodes?: Set<string>): ReactNode => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    let children = edgeMap.get(nodeId) || [];
    if (visibleNodes) {
      children = children.filter(c => visibleNodes.has(c));
    }
    const hasChildren = children.length > 0;
    const isExpanded = expanded.includes(nodeId);
    const bgColor = NODE_COLORS[node.color || '0'] || NODE_COLORS['0'];
    const person = getPersonForNode(nodeId);
    const name = node.type === 'file' 
      ? (person?.name || node.file?.split('/').pop()?.replace('.md', '') || 'Unknown File')
      : node.text.split('\n')[0];

    return (
      <View key={nodeId} className="mb-1">
        <TouchableOpacity
          className="flex-row items-center p-3 rounded-lg mb-0.5"
          style={{ 
            backgroundColor: bgColor, 
            marginLeft: 10,
            flexDirection: 'row'
          }}
          onPress={() => hasChildren && toggleNode(nodeId)}
        >
          <View className="flex-row items-center flex-1">
            {person && (
              <TouchableOpacity
                onPress={() => handleNodePress(nodeId)}
                className="w-8 h-8 items-center justify-center mr-2 bg-white/10 rounded-full"
              >
                <Ionicons name="eye" size={16} color="white" />
              </TouchableOpacity>
            )}
            <Text
              className="flex-1 text-sm font-bold text-white"
              numberOfLines={1}
              style={{ textAlign: 'left' }}
            >
              {name}
            </Text>
          </View>

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

        {isExpanded && hasChildren && (
          <View
            className="border-l-2 pt-1"
            style={{ borderColor: '#bc6798', marginLeft: 10 }}
          >
            {children.map((childId, idx) => renderTreeNode(childId, level + 1, idx === children.length - 1, visibleNodes))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-3 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TextInput
          className="p-2.5 rounded-lg text-base"
          style={{ backgroundColor: colors.card, color: colors.text, textAlign: 'right' }}
          placeholder="بحث..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="p-4">
          {filteredRootNodeIds.map(rootId => renderTreeNode(rootId, 0, true, searchQuery.trim() ? searchResults.nodesToShow : undefined))}
        </View>
      </ScrollView>

      <View className="p-3 pb-12 border-t" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push('/settings')} className="flex-row justify-center items-center py-2">
          <Ionicons name="settings" size={18} color={colors.textSecondary} />
          <Text className="text-sm mr-2" style={{ color: colors.textSecondary }}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}