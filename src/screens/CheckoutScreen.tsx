import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCart } from '@context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { validateCardNumber, validateExpiryDate, validateCVV, formatCardNumber, formatExpiryDate } from '@utils/paymentValidation';
import { processPayment, createOrder } from '@services/paymentService';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Format card number and expiry date as user types
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = () => {
    const requiredFields: (keyof FormData)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Validate payment information
    if (!validateCardNumber(formData.cardNumber)) {
      Alert.alert('Invalid Card', 'Please enter a valid card number.');
      return false;
    }

    if (!validateExpiryDate(formData.expiryDate)) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY).');
      return false;
    }

    if (!validateCVV(formData.cvv)) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV (3 or 4 digits).');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Process payment
      const paymentSuccess = await processPayment({
        cardNumber: formData.cardNumber,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        amount: totalPrice,
        currency: 'ZAR',
      });

      if (!paymentSuccess) {
        throw new Error('Payment failed');
      }

      // Create order
      const order = await createOrder({
        items: items.map(item => ({
          ...item,
          price: parseFloat(item.price)
        })),
        shipping: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        payment: {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          amount: totalPrice,
          currency: 'ZAR',
        },
        total: totalPrice,
      });
      
      // Clear cart and show success message
      clearCart();
      Alert.alert(
        'Order Successful!',
        `Thank you for your purchase. Your order number is ${order.orderId}. You will receive a confirmation email shortly.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ProductCollection'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'There was a problem processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Information</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="City"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Postal Code"
            keyboardType="numeric"
            value={formData.postalCode}
            onChangeText={(value) => handleInputChange('postalCode', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Card Number"
          keyboardType="numeric"
          value={formData.cardNumber}
          onChangeText={(value) => handleInputChange('cardNumber', value)}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChangeText={(value) => handleInputChange('expiryDate', value)}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="CVV"
            keyboardType="numeric"
            value={formData.cvv}
            onChangeText={(value) => handleInputChange('cvv', value)}
          />
        </View>
      </View>

      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Text style={styles.summaryText}>Items: {items.length}</Text>
        <Text style={styles.totalText}>
          Total: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(totalPrice)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
        onPress={handleCheckout}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkoutButtonText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  halfInput: {
    flex: 1,
  },
  orderSummary: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2ecc71',
  },
  checkoutButton: {
    backgroundColor: '#2ecc71',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 