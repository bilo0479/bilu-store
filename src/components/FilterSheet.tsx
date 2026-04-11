import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import { CONDITIONS } from '../constants/conditions';
import type { SearchFilters, CategoryId, AdCondition } from '../types';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

/** Sort options available in the filter sheet. */
const SORT_OPTIONS: Array<{ value: SearchFilters['sortBy']; label: string }> = [
  { value: 'NEWEST', label: 'Newest First' },
  { value: 'PRICE_LOW', label: 'Price: Low to High' },
  { value: 'PRICE_HIGH', label: 'Price: High to Low' },
  { value: 'RELEVANCE', label: 'Relevance' },
];

/**
 * Bottom sheet modal for search filters.
 * Includes category chips, price range inputs, condition selector,
 * sort selector, and an apply button.
 */
export function FilterSheet({ visible, onClose, filters, onApply }: FilterSheetProps) {
  const [local, setLocal] = useState<SearchFilters>(filters);

  // Sync local state when the sheet becomes visible
  React.useEffect(() => {
    if (visible) {
      setLocal(filters);
    }
  }, [visible, filters]);

  const handleApply = useCallback(() => {
    onApply(local);
    onClose();
  }, [local, onApply, onClose]);

  const toggleCategory = useCallback((id: CategoryId) => {
    setLocal((prev) => ({
      ...prev,
      categoryId: prev.categoryId === id ? undefined : id,
    }));
  }, []);

  const setCondition = useCallback((c: AdCondition | undefined) => {
    setLocal((prev) => ({
      ...prev,
      condition: prev.condition === c ? undefined : c,
    }));
  }, []);

  const setSortBy = useCallback((value: SearchFilters['sortBy']) => {
    setLocal((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_DARK} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
              {/* Category chips */}
              <Text style={styles.sectionLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {CATEGORIES.map((cat) => {
                  const selected = local.categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => toggleCategory(cat.id)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Price range */}
              <Text style={styles.sectionLabel}>Price Range</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={COLORS.TEXT_MUTED}
                  keyboardType="numeric"
                  value={local.minPrice != null ? String(local.minPrice) : ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({
                      ...prev,
                      minPrice: t.length > 0 ? Number(t) : undefined,
                    }))
                  }
                />
                <Text style={styles.priceSeparator}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={COLORS.TEXT_MUTED}
                  keyboardType="numeric"
                  value={local.maxPrice != null ? String(local.maxPrice) : ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({
                      ...prev,
                      maxPrice: t.length > 0 ? Number(t) : undefined,
                    }))
                  }
                />
              </View>

              {/* Condition selector */}
              <Text style={styles.sectionLabel}>Condition</Text>
              <View style={styles.conditionRow}>
                {CONDITIONS.map((c) => {
                  const selected = local.condition === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCondition(c.id)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {c.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Sort selector */}
              <Text style={styles.sectionLabel}>Sort By</Text>
              <View style={styles.sortColumn}>
                {SORT_OPTIONS.map((opt) => {
                  const selected = local.sortBy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setSortBy(opt.value)}
                      style={styles.sortOption}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? COLORS.ACCENT : COLORS.TEXT_MUTED}
                      />
                      <Text style={[styles.sortLabel, selected && styles.sortLabelSelected]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Apply button */}
            <Pressable onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.BG_CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  headerTitle: {
    fontSize: FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.SM,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.BG_SCREEN,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  chipSelected: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  chipText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_DARK,
  },
  chipTextSelected: {
    color: COLORS.TEXT_ON_ACCENT,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BG_SCREEN,
    paddingHorizontal: 12,
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
  },
  priceSeparator: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_MUTED,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortColumn: {
    gap: 4,
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  sortLabel: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
  },
  sortLabelSelected: {
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
  applyButton: {
    marginHorizontal: 16,
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.TEXT_ON_ACCENT,
  },
});
