import React, { useRef, useState } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';

interface BannerItem {
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

interface BannerCarouselProps {
  banners: BannerItem[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const { width } = Dimensions.get('window');
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.banner, { width: width - 24 }]}> 
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            {(item.title || item.subtitle) && (
              <View style={[
                styles.overlay,
                item.title?.trim() === 'Welcome to WBWR Shop!' && styles.overlayBlack,
              ]}>
                {item.title && <Text style={styles.title}>{item.title}</Text>}
                {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
              </View>
            )}
          </View>
        )}
        snapToAlignment="center"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />
      <View style={styles.dotsContainer}>
        {banners.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.dot, activeIndex === idx && styles.activeDot]}
            onPress={() => flatListRef.current?.scrollToIndex({ index: idx, animated: true })}
          />
        ))}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  banner: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 6,
    backgroundColor: '#eee',
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayBlack: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    marginTop: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bbb',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#3498db',
    width: 16,
  },
}); 