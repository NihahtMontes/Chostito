import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ClientTabs from './ClientTabs';
import EventoDetalleScreen from '../screens/client/EventoDetalleScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import AdminTabs from './AdminTabs';
import AdminEventoFormScreen from '../screens/admin/AdminEventoFormScreen';
import AdminCategoriasScreen from '../screens/admin/AdminCategoriasScreen';
import AdminLugaresScreen from '../screens/admin/AdminLugaresScreen';
import AdminUsuariosScreen from '../screens/admin/AdminUsuariosScreen';
import AdminRegistrarUsuarioScreen from '../screens/admin/AdminRegistrarUsuarioScreen';
import AdminTodosEventosScreen from '../screens/admin/AdminTodosEventosScreen';
import AdminGananciasScreen from '../screens/admin/AdminGananciasScreen';
import AdminEventoEstadisticasScreen from '../screens/admin/AdminEventoEstadisticasScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.rol === 'Cliente' ? (
          <>
            <Stack.Screen name="ClientHome" component={ClientTabs} />
            <Stack.Screen name="EventoDetalle" component={EventoDetalleScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="AdminHome" component={AdminTabs} />
            <Stack.Screen name="AdminEventoForm" component={AdminEventoFormScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminCategorias" component={AdminCategoriasScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminLugares" component={AdminLugaresScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminRegistrarUsuario" component={AdminRegistrarUsuarioScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminTodosEventos" component={AdminTodosEventosScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminGanancias" component={AdminGananciasScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AdminEventoEstadisticas" component={AdminEventoEstadisticasScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
