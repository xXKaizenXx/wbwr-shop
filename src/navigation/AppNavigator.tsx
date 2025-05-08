import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartProvider } from '@context/CartContext';

import ProductCollectionScreen from '@screens/ProductCollectionScreen';
import ProductDetailScreen from '@screens/ProductDetailScreen';
import CartScreen from '@screens/CartScreen';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderHistoryScreen from '@screens/OrderHistoryScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';

export type RootStackParamList = {
  ProductCollection: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="ProductCollection"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="ProductCollection"
            component={ProductCollectionScreen}
            options={{ title: 'Products' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'Shopping Cart' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <Stack.Screen
            name="OrderHistory"
            component={OrderHistoryScreen}
            options={{ title: 'Order History' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Order Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
