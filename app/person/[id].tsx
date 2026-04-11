import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useFamily } from '../../src/context/FamilyContext';
import { Person } from '../../src/types';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { persons } = useFamily();
  const [person, setPerson] = useState<Person | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      const decodedId = decodeURIComponent(id);
      const found = persons.find(p => p.id === decodedId);
      if (found) {
        setPerson(found);
        navigation.setOptions({ title: found.name });
      }
    }
  }, [id, persons]);

  if (!person) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bc6798" />
      </View>
    );
  }

  const images = person.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <ScrollView style={styles.container}>
      {hasMultipleImages ? (
        <View style={styles.imageCarousel}>
          <Image
            source={{ uri: images[currentImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageIndicators}>
            {images.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.indicator,
                  idx === currentImageIndex && styles.indicatorActive,
                ]}
                onPress={() => setCurrentImageIndex(idx)}
              />
            ))}
          </View>
        </View>
      ) : images.length === 1 ? (
        <Image
          source={{ uri: images[0] }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>
            {person.gender === 'female' ? '👩' : '👨'}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{person.name}</Text>
        
        {person.nickname && (
          <Text style={styles.nickname}>"{person.nickname}"</Text>
        )}

        <View style={styles.infoRow}>
          {person.birthDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>تاريخ الميلاد</Text>
              <Text style={styles.infoValue}>{person.birthDate}</Text>
            </View>
          )}
          
          {person.deathDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>تاريخ الوفاة</Text>
              <Text style={styles.infoValue}>{person.deathDate}</Text>
            </View>
          )}
          
          {person.occupation && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>المهنة</Text>
              <Text style={styles.infoValue}>{person.occupation}</Text>
            </View>
          )}
          
          {person.gender && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>الجنس</Text>
              <Text style={styles.infoValue}>
                {person.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Text>
            </View>
          )}
        </View>

        {person.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>السيرة الذاتية</Text>
            <Text style={styles.bioText}>{person.bio}</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  imageCarousel: {
    width: '100%',
    aspectRatio: 1,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#bc6798',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  nickname: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  infoItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bioSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
});