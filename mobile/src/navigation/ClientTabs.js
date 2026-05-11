import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

import HomeScreen from '../screens/client/HomeScreen';
import MisReservasScreen from '../screens/client/MisReservasScreen';
import FavoritosScreen from '../screens/client/FavoritosScreen';
import MapaScreen from '../screens/client/MapaScreen';

const Tab = createBottomTabNavigator();

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Explorar') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Mis Reservas') iconName = focused ? 'ticket' : 'ticket-outline';
          else if (route.name === 'Favoritos') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Ubicaciones') iconName = focused ? 'map' : 'map-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explorar" component={HomeScreen} />
      <Tab.Screen name="Ubicaciones" component={MapaScreen} />
      <Tab.Screen name="Mis Reservas" component={MisReservasScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
    </Tab.Navigator>
  );
}
