import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { CanvasNode } from '../src/types';

const NODE_COLORS: Record<string, string> = {
  '1': '#bc6798',
  '2': '#9969b0',
  '3': '#7c8cd6',
  '4': '#5b9',
  '5': '#c95',
  '6': '#e87925',
  '#bc6798': '#bc6798',
  '#9969b0': '#9969b0',
  '#7c8cd6': '#7c8cd6',
  '#5b9': '#5b9',
  '#c95': '#c95',
  '#ffffff': '#f5f5f5',
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
    canvasData.nodes.filter(n => n.type === 'text').forEach(n => map.set(n.id, n));
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

  const rootNodeIds = useMemo(() => {
    if (!canvasData) return [];
    const textNodes = canvasData.nodes.filter(n => n.type === 'text');
    const childIds = new Set(canvasData.edges.map(e => e.toNode));
    return textNodes.filter(n => !childIds.has(n.id)).map(n => n.id);
  }, [canvasData]);

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

  const renderTreeNode = (nodeId: string, level: number, _isLast: boolean): ReactNode => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    
    const children = edgeMap.get(nodeId) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.includes(nodeId);
    const bgColor = NODE_COLORS[node.color || '3'] || '#7c8cd6';
    const name = node.text.split('\n')[0];
    
    const person = getPersonForNode(nodeId);
    
    return (
      <View key={nodeId} className="mb-1">
        <View 
          className="flex-row items-center p-2 rounded-lg mb-0.5"
          style={{ backgroundColor: bgColor, marginRight: 10 }}
        >
          {person && (
            <TouchableOpacity 
              onPress={() => handleNodePress(nodeId)} 
              className="w-5 h-5 items-center justify-center ml-1.5"
            >
              <Ionicons name="eye" size={16} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            className="flex-1"
            onPress={() => {
              if (hasChildren) toggleNode(nodeId);
            }}
          >
            <Text 
              className="text-sm font-bold text-white text-right" 
              numberOfLines={1}
            >
              {name}
            </Text>
          </TouchableOpacity>
          {hasChildren && (
            <Text className="text-xs mr-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {children.length}
            </Text>
          )}
          {hasChildren && (
            <TouchableOpacity 
              onPress={() => toggleNode(nodeId)} 
              className="w-3.5 items-center"
            >
              <Text className="text-xs text-white">
                {isExpanded ? '▼' : '◀'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isExpanded && hasChildren && (
          <View 
            className="border-r-2 pt-1" 
            style={{ borderColor: '#bc6798', marginRight: 10 }}
          >
            {children.map((childId, idx) => renderTreeNode(childId, level + 1, idx === children.length - 1))}
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
          {rootNodeIds.map(rootId => renderTreeNode(rootId, 0, true))}
        </View>
      </ScrollView>

      <View className="p-3 pb-8 border-t" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push('/settings')} className="flex-row justify-center items-center py-2">
          <Ionicons name="settings" size={18} color={colors.textSecondary} />
          <Text className="text-sm mr-2" style={{ color: colors.textSecondary }}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}