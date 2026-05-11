import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMisEventosScreen from '../screens/admin/AdminMisEventosScreen';
import AdminEscanearQRScreen from '../screens/admin/AdminEscanearQRScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
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
          if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Mis Eventos') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Escanear QR') iconName = focused ? 'qr-code' : 'qr-code-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Mis Eventos" component={AdminMisEventosScreen} />
      <Tab.Screen name="Escanear QR" component={AdminEscanearQRScreen} />
    </Tab.Navigator>
  );
}
