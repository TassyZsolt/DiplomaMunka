import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen/HomeScreen';
import RegisterScreen from './screens/RegScreen/RegisterScreen';
import LoginScreen from './screens/LogScreen/LoginScreen';
import MenuScreen from './screens/MenuScreen/MenuScreen';
import ProfilScreen from './screens/ProfileScreen/ProfilScreen';
import StatScreen from './screens/StatScreen/StatScreen';
import ExerciseScreen from './screens/ExerciseScreen/ExerciseScreen';
import DietScreen from './screens/DietScreen/DietScreen';
import EditProfileScreen from './screens/ProfileScreen/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'Főoldal'}}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{title: 'Regisztráció'}} />
        <Stack.Screen name="Login" component={LoginScreen} options={{title: 'Bejelentkezés'}} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{title: 'Menu oldal'}} />
        <Stack.Screen name="Profil" component={ProfilScreen} options={{title: 'Profil oldal'}} />
        <Stack.Screen name="Stats" component={StatScreen} options={{title: 'Statisztika oldal'}} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} options={{title: 'Edzés oldal'}} />
        <Stack.Screen name="Diet" component={DietScreen} options={{title: 'Diéta oldal'}} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Diéta oldal'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
