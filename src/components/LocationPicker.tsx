import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import { useLocation } from '../hooks/useLocation';

interface LocationPickerProps {
  value: string;
  onChange: (city: string) => void;
}

/**
 * City selector with a text input, location icon, and
 * an optional "Use Current Location" button powered by the useLocation hook.
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { city, isLoading, error, requestLocation } = useLocation();

  /* When the hook resolves a city, propagate it to the parent. */
  useEffect(() => {
    if (city) {
      onChange(city);
    }
  }, [city, onChange]);

  return (
    <View style={styles.container}>
      {/* Text input row */}
      <View style={styles.inputRow}>
        <Ionicons
          name="location-outline"
          size={20}
          color={COLORS.TEXT_MUTED}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Enter city name"
          placeholderTextColor={COLORS.TEXT_MUTED}
        />
      </View>

      {/* Use current location button */}
      <Pressable
        onPress={requestLocation}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.locationBtn,
          pressed && styles.locationBtnPressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.ACCENT} />
        ) : (
          <Ionicons name="navigate-outline" size={16} color={COLORS.ACCENT} />
        )}
        <Text style={styles.locationBtnText}>Use Current Location</Text>
      </Pressable>

      {/* Error message */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    backgroundColor: COLORS.BG_CARD,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
    paddingVertical: 12,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  locationBtnPressed: {
    opacity: 0.7,
  },
  locationBtnText: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.ACCENT,
    fontWeight: '500',
  },
  error: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.ERROR_RED,
  },
});
