import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const workouts = [
  { id: '1', name: 'Teljes test edzés' },
  { id: '2', name: 'Felsőtest' },
  { id: '3', name: 'Lábnap' },
  { id: '4', name: 'Kardió' },
];

const ExerciseScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity style={styles.item} onPress={() => alert(`Kiválasztva: ${item.name}`)}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Válassz edzéstervet:</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default ExerciseScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  item: {
    padding: 16,
    backgroundColor: '#3AC786',
    borderRadius: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
  },
});




