import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useFamily } from '../src/context/FamilyContext';
import { CanvasNode } from '../src/types';

interface TreeItemProps {
  node: CanvasNode;
  level: number;
  isLast: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onPress: () => void;
}

const NODE_COLORS: Record<string, string> = {
  '1': '#bc6798',
  '2': '#9969b0',
  '3': '#7c8cd6',
  '4': '#5b9',
  '5': '#c95',
  '#bc6798': '#bc6798',
  '#9969b0': '#9969b0',
  '#ffffff': '#f5f5f5',
};

export default function TreeScreen() {
  const { canvasData, persons, isLoading, getPersonForNode } = useFamily();
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bc6798" />
        <Text style={styles.loadingText}>جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (!canvasData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لم يتم تحميل الشجرة العائلية</Text>
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
      <View key={nodeId} style={treeStyles.nodeContainer}>
        <View style={[treeStyles.nodeCard, { backgroundColor: bgColor, marginRight: level * 4 }]}>
          {person && (
            <TouchableOpacity onPress={() => handleNodePress(nodeId)} style={treeStyles.viewBtn}>
              <Text style={treeStyles.viewIcon}>⊕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={treeStyles.namePressable}
            onPress={() => {
              if (hasChildren) toggleNode(nodeId);
            }}
          >
            <Text style={treeStyles.nodeName} numberOfLines={1}>{name}</Text>
          </TouchableOpacity>
          {hasChildren && (
            <Text style={treeStyles.childCount}>{children.length}</Text>
          )}
          {hasChildren && (
            <TouchableOpacity onPress={() => toggleNode(nodeId)} style={treeStyles.expandBtn}>
              <Text style={treeStyles.expandIcon}>{isExpanded ? '▼' : '◀'}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isExpanded && hasChildren && (
          <View style={treeStyles.childrenContainer}>
            {children.map((childId, idx) => renderTreeNode(childId, level + 1, idx === children.length - 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.treeScroll} contentContainerStyle={styles.treeContent}>
        <View style={treeStyles.treeRoot}>
          {rootNodeIds.map(rootId => renderTreeNode(rootId, 0, true))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
         tap: view details | hold: expand/collapse ({persons.length})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#c00',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  treeScroll: {
    flex: 1,
  },
  treeScrollVertical: {
    flex: 1,
  },
  treeContent: {
    padding: 10,
  },
  nodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  treeContainer: {
    padding: 10,
  },
  genRow: {
    marginBottom: 16,
  },
  genLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#bc6798',
    marginBottom: 8,
    textAlign: 'right',
  },
  genNodes: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  treeContentVertical: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    padding: 10,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    alignContent: 'flex-start',
  },
  gridNode: {
    width: 140,
    height: 70,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  gridNodeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridNodePos: {
    color: '#fff',
    fontSize: 8,
  },
  node: {
    width: 140,
    height: 60,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  selectedNode: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nodeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  legend: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchResult: {
    width: '47%',
    margin: '1.5%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchResultText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

const treeStyles = StyleSheet.create({
  treeRoot: {
    padding: 16,
  },
  nodeContainer: {
    marginBottom: 4,
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  namePressable: {
    flex: 1,
  },
  expandBtn: {
    marginRight: 4,
    width: 14,
    alignItems: 'center',
  },
  viewBtn: {
    marginLeft: 6,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 12,
    color: '#fff',
  },
  nodeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  childCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginRight: 6,
  },
  childrenContainer: {
    marginRight: 8,
    borderRightWidth: 2,
    borderRightColor: '#bc6798',
    paddingRight: 8,
    marginTop: 4,
  },
});