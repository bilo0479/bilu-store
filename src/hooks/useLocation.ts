import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  city: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({ city: null, coordinates: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });

      const city = place?.city ?? place?.subregion ?? place?.region ?? 'Unknown';
      setLocation({ city, coordinates: coords });
    } catch {
      setError('Could not get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCity = useCallback((city: string) => {
    setLocation((prev) => ({ ...prev, city }));
  }, []);

  return { ...location, isLoading, error, requestLocation, setCity };
}
