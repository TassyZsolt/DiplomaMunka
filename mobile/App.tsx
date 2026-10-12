import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen/HomeScreen';
import RegisterScreen from './src/screens/RegScreen/RegisterScreen';
import LoginScreen from './src/screens/LogScreen/LoginScreen';
import MenuScreen from './src/screens/MenuScreen/MenuScreen';
import ProfilScreen from './src/screens/ProfileScreen/ProfilScreen';
import StatScreen from './src/screens/StatScreen/StatScreen';
import ExerciseScreen from './src/screens/ExerciseScreen/ExerciseScreen';
import DietScreen from './src/screens/DietScreen/DietScreen';
import EditProfileScreen from './src/screens/ProfileScreen/EditProfileScreen';
import PersonalStatsScreen from './src/screens/PersonalStatsScreen/PersonalStatsScreen';
import StepCounterScreen from './src/screens/StepCounterScreen/StepCounterScreen';
import WorkoutProgressScreen from './src/screens/WorkoutProgressScreen/WorkoutProgressScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
        <Stack.Screen name="Home" component={HomeScreen} options={{title: 'Főoldal'}}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{title: 'Főmenü', headerBackVisible: false}} />
        <Stack.Screen name="Profil" component={ProfilScreen} options={{title: 'Profil oldal'}} />
        <Stack.Screen name="Stats" component={StatScreen} options={{title: 'Statisztika oldal'}} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} options={{title: 'Edzés oldal'}} />
        <Stack.Screen name="Diet" component={DietScreen} options={{title: 'Diéta oldal'}} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'Profil szerkesztése'}} />
        <Stack.Screen name="PersonalStats" component={PersonalStatsScreen} options={{title: 'Személyes statisztikák'}} />
        <Stack.Screen name="personalStats" component={PersonalStatsScreen} options={{title: 'Személyes statisztikák'}} />
        <Stack.Screen name="StepCounter" component={StepCounterScreen} options={{title: 'Lépésszámláló'}} />
        <Stack.Screen name="stepCounter" component={StepCounterScreen} options={{title: 'Lépésszámláló'}} />
        <Stack.Screen name="WorkoutProgress" component={WorkoutProgressScreen} options={{title: 'Edzések & Előrehaladás'}} />
        <Stack.Screen name="workoutProgress" component={WorkoutProgressScreen} options={{title: 'Edzések & Előrehaladás'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
