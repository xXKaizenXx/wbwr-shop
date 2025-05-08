import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useCart } from '@context/CartContext';
import { shopifyClient } from '@api/shopifyClient';
import { gql } from 'graphql-request';
import { RootStackParamList } from '@navigation/AppNavigator';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface ProductImage {
  url: string;
}

interface ProductVariant {
  title: string;
  price: {
    amount: string;
  };
}

interface Product {
  id: string;
  title: string;
  description: string;
  images: {
    edges: Array<{
      node: ProductImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ProductVariant;
    }>;
  };
}

interface ProductResponse {
  product: Product;
}

const PRODUCT_QUERY = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      images(first: 5) {
        edges {
          node {
            url
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            title
            price {
              amount
            }
          }
        }
      }
    }
  }
`;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation();
  const { productId } = route.params;
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await shopifyClient.request<ProductResponse>(PRODUCT_QUERY, {
          id: productId,
        });
        setProduct(response.product);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const selectedVariantData = product.variants.edges[0]?.node;
      if (!selectedVariantData) {
        throw new Error('No variant available');
      }

      await addToCart({
        id: product.id,
        title: product.title,
        price: selectedVariantData.price.amount,
        image: product.images.edges[0]?.node.url || '',
        variant: selectedVariant || undefined,
      });

      Alert.alert('Success', 'Product added to cart!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images.edges.map(edge => edge.node.url);
  const variants = product.variants.edges.map(edge => edge.node);

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: images[selectedImageIndex] }}
        style={styles.image}
        resizeMode="contain"
      />
      
      {images.length > 1 && (
        <ScrollView horizontal style={styles.thumbnailContainer}>
          {images.map((url, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImageIndex(index)}
              style={[
                styles.thumbnail,
                selectedImageIndex === index && styles.selectedThumbnail,
              ]}
            >
              <Image source={{ uri: url }} style={styles.thumbnailImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
          }).format(parseFloat(variants[0]?.price.amount || '0'))}
        </Text>
        
        <Text style={styles.description}>{product.description}</Text>

        {variants.length > 1 && (
          <View style={styles.variantsContainer}>
            <Text style={styles.variantsTitle}>Available Variants:</Text>
            {variants.map((variant, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.variantButton,
                  selectedVariant === variant.title && styles.selectedVariant,
                ]}
                onPress={() => setSelectedVariant(variant.title)}
              >
                <Text style={styles.variantText}>{variant.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addToCartButton, isAddingToCart && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={isAddingToCart}
        >
          <Text style={styles.addToCartButtonText}>
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedThumbnail: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#2ecc71',
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  variantsContainer: {
    marginBottom: 24,
  },
  variantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  variantButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedVariant: {
    borderColor: '#3498db',
    backgroundColor: '#ebf5fb',
  },
  variantText: {
    fontSize: 16,
    color: '#333',
  },
  addToCartButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
