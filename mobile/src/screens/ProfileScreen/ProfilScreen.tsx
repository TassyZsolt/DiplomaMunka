import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet} from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const ProfileScreen = ({navigation} : any) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.warn('Nincs ilyen felhasználó a Firestore-ban');
          }
        }
      } catch (err) {
        console.error('Hiba a profil betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Név:</Text>
      <Text style={styles.value}>{userData?.firstName} {userData?.lastName}</Text>

      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{userData?.email}</Text>

      <Button title="Profil szerkesztése" onPress={() => navigation.navigate('EditProfile', { userData })} />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'background'
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
