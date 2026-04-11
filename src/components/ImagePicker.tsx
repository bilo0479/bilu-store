import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';

interface ImagePickerProps {
  images: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxCount: number;
}

/**
 * Multi-image picker grid with thumbnails, remove buttons, and an add button.
 * Shows the current/max count and disables adding when the limit is reached.
 */
export function ImagePicker({
  images,
  onAdd,
  onRemove,
  maxCount,
}: ImagePickerProps) {
  const isAtMax = images.length >= maxCount;

  return (
    <View style={styles.container}>
      {/* Count label */}
      <Text style={styles.count}>
        {images.length}/{maxCount}
      </Text>

      <View style={styles.grid}>
        {/* Existing image thumbnails */}
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrapper}>
            <Image
              source={{ uri }}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
            />
            <Pressable
              onPress={() => onRemove(index)}
              style={styles.removeBtn}
              hitSlop={6}
            >
              <Ionicons name="close-circle" size={22} color={COLORS.ERROR_RED} />
            </Pressable>
          </View>
        ))}

        {/* Add photo button */}
        {!isAtMax && (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && styles.addBtnPressed,
            ]}
          >
            <Ionicons name="camera-outline" size={28} color={COLORS.TEXT_MUTED} />
            <Text style={styles.addText}>Add Photo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const THUMB_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  count: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.BG_CARD,
    borderRadius: 11,
  },
  addBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.BG_SCREEN,
  },
  addBtnPressed: {
    opacity: 0.7,
  },
  addText: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
});
