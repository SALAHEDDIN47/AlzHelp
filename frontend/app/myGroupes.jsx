import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MyGroupes() {
  const router = useRouter();
  const [groups, setGroups] = useState([
    { id: '1', name: 'Groupe Alzheimer Support', members: 12 },
    { id: '2', name: 'Aidants Familiaux', members: 8 },
    { id: '3', name: 'Partage d\'expériences', members: 15 },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.groupItem}
      onPress={() => router.push(`/groupe/${item.id}`)}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.members} membres</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#2A62F9" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Groupes</Text>
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/createGroup')}
      >
        <Text style={styles.createButtonText}>Créer un nouveau groupe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2A62F9',
  },
  listContainer: {
    paddingBottom: 20,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#2A62F9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});