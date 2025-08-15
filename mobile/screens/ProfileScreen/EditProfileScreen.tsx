import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import styles from './ProfileScreenStyle';
import { Image } from 'react-native';
import placeholderAvatar from '../../assets/images/placeholderAvatar.jpg';


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

