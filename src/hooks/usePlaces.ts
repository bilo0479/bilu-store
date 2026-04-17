/**
 * usePlaces — Google Places Autocomplete with session tokens.
 *
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_KEY env var.
 * Uses session tokens to bundle Place Details lookups into one billing unit.
 */
import { useState, useCallback, useRef } from "react";

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetail {
  placeId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";
const DEBOUNCE_MS = 200;

function generateSessionToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function usePlaces() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionToken = useRef(generateSessionToken());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || !API_KEY) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&components=country:et&sessiontoken=${sessionToken.current}&key=${API_KEY}`,
    );
    if (!res.ok) return;
    const data = await res.json();

    setSuggestions(
      (data.predictions ?? []).map((p: Record<string, unknown>) => ({
        placeId: p.place_id as string,
        description: p.description as string,
        mainText: (p.structured_formatting as Record<string, string>)?.main_text ?? "",
        secondaryText: (p.structured_formatting as Record<string, string>)?.secondary_text ?? "",
      })),
    );
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        await fetchSuggestions(text);
        setLoading(false);
      }, DEBOUNCE_MS);
    },
    [fetchSuggestions],
  );

  const getDetail = useCallback(async (placeId: string): Promise<PlaceDetail | null> => {
    if (!API_KEY) return null;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,address_components&sessiontoken=${sessionToken.current}&key=${API_KEY}`,
    );
    // Rotate session token after Place Details call (Googled billing boundary)
    sessionToken.current = generateSessionToken();

    if (!res.ok) return null;
    const data = await res.json();
    const result = data.result;
    if (!result) return null;

    const cityComponent = (result.address_components ?? []).find(
      (c: { types: string[] }) => c.types.includes("locality"),
    );

    return {
      placeId,
      name: result.name ?? "",
      city: cityComponent?.long_name ?? result.name ?? "",
      lat: result.geometry?.location?.lat ?? 0,
      lng: result.geometry?.location?.lng ?? 0,
    };
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, onChangeText, getDetail, clearSuggestions };
}
