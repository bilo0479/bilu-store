import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { CATEGORIES, type CategoryMeta } from '../constants/categories';

interface CategoryGridProps {
  onSelect: (id: string) => void;
}

function CategoryItem({ cat, onPress }: { cat: CategoryMeta; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '20' }]}>
        <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={24} color={cat.color} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {cat.label}
      </Text>
    </Pressable>
  );
}

export function CategoryGrid({ onSelect }: CategoryGridProps) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => (
        <CategoryItem key={cat.id} cat={cat} onPress={() => onSelect(cat.id)} />
      ))}
    </View>
  );
}

export function CategoryRow({ onSelect }: CategoryGridProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => onSelect(cat.id)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color={cat.color} />
          <Text style={styles.chipLabel}>{cat.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    width: '18%',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FONT_SIZE.XS,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.BG_CARD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  chipLabel: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
});
