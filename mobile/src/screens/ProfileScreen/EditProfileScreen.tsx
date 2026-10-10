import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Image } from 'react-native';
import placeholderAvatar from '../../../assets/images/placeholderAvatar.jpg';
import { colors } from '../../themes/tokens';


const EditProfileScreen = ({ route, navigation }: any) => {
  const { userData } = route.params;
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { firstName, lastName });
        Alert.alert('Sikeres mentés!');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Hiba', 'Mentés nem sikerült');
    }
  };

 return (
  <View style={styles.container}>
    <TextInput
      placeholder="Vezetéknév"
      value={lastName}
      onChangeText={setLastName}
      style={styles.input}
    />
    <TextInput
      placeholder="Keresztnév"
      value={firstName}
      onChangeText={setFirstName}
      style={styles.input}
    />
    <Button title="Mentés" onPress={handleSave} />

    <Image
    style={{width: 100, height: 100}}
    source={placeholderAvatar}
   />

  </View>
);

};

export default EditProfileScreen;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20
  },
  value: {
    fontSize: 16,
    marginTop: 4
  },
  loader: {
    flex: 1,
    justifyContent: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
  }
});


