import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { shopifyClient } from '@api/shopifyClient';
import { gql } from 'graphql-request';
import { RootStackParamList } from '@navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCart } from '@context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { BannerCarousel } from '../components/BannerCarousel';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProductCollection'>;

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  images: {
    edges: { node: { url: string } }[];
  };
  variants: {
    edges: { node: { price: { amount: string }; title: string } }[];
  };
}

interface ShopifyResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
}

const PRODUCTS_PER_PAGE = 10;

const PRODUCTS_QUERY = gql`
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 1) {
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
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const BANNERS = [
  {
    imageUrl: 'https://img.evetech.co.za/repository/ProductImages/intel-amd-based-bundle-packs-banner-875px-v3.webp?width=885',
    title: 'Welcome to the WBWR Shop!',
    subtitle: 'Enjoy exclusive deals and new arrivals',
  },
  {
    imageUrl: 'https://img.evetech.co.za/repository/ProductImages/Laptop-Deals-580px-v4.webp?width=474',
    title: 'Laptops',
    subtitle: 'For creatives and developers',
  },
  {
    imageUrl: 'https://img.evetech.co.za/repository/ProductImages/Monitors-580px-v3.webp?width=474',
    title: 'Monitors',
    subtitle: 'Play at your best',
  },
];

export default function ProductCollectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { totalItems } = useCart();
  const [endCursor, setEndCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [products, setProducts] = React.useState<ShopifyProduct[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery<ShopifyResponse>({
    queryKey: ['products', endCursor],
    queryFn: async (): Promise<ShopifyResponse> => {
      try {
        const response = await shopifyClient.request(PRODUCTS_QUERY, {
          first: PRODUCTS_PER_PAGE,
          after: endCursor,
        });
        return response as ShopifyResponse;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to load products. Please try again.');
      }
    },
    retry: 2,
    enabled: hasMore,
  });

  React.useEffect(() => {
    if (data) {
      const newProducts = data.products.edges.map(edge => edge.node);
      // Filter out any duplicate products by ID
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewProducts];
      });
      setHasMore(data.products.pageInfo.hasNextPage);
      setEndCursor(data.products.pageInfo.endCursor);
    }
  }, [data]);

  const loadMore = () => {
    if (!isLoading && hasMore && !isRefreshing) {
      setEndCursor(data?.products.pageInfo.endCursor || null);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setProducts([]);
      setEndCursor(null);
      setHasMore(true);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartButtonText}>🛒</Text>
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, totalItems]);

  const renderItem = ({ item }: { item: ShopifyProduct }) => (
    <ProductCard
      id={item.id}
      title={item.title}
      price={item.variants.edges[0]?.node.price.amount || '0'}
      imageUrl={item.images.edges[0]?.node.url || ''}
    />
  );

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  if (isError && products.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error?.message || 'Failed to load products'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (products.length === 0 && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      <FlatList
        ListHeaderComponent={
          <>
            <BannerCarousel banners={BANNERS} />
            <Text style={styles.sectionHeader}>Featured Products</Text>
          </>
        }
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={['#0000ff']}
            tintColor="#0000ff"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
    paddingHorizontal: 4,
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
  cartButton: {
    marginRight: 16,
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    color: '#222',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
