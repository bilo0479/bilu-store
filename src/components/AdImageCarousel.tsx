import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONT_SIZE } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdImageCarouselProps {
  images: string[];
  height?: number;
}

/**
 * Swipeable image gallery with dot indicators and counter.
 * Uses horizontal paging FlatList for smooth swipe navigation.
 */
export function AdImageCarousel({ images, height = 300 }: AdImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, height }}
            contentFit="cover"
            transition={200}
          />
        )}
      />
      {images.length > 1 && (
        <>
          {/* Counter badge (e.g. "1/5") */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: COLORS.BG_DISABLED,
  },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterText: {
    color: COLORS.TEXT_ON_ACCENT,
    fontSize: FONT_SIZE.XS,
    fontWeight: '600',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.ACCENT,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
