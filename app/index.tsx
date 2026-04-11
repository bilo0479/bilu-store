import { Redirect } from 'expo-router';

/**
 * Root entry point.
 *
 * Expo Router resolves "/" to this file. We immediately redirect to the
 * tab navigator's home screen so the user lands on the correct initial UI.
 *
 * Why a redirect instead of rendering here:
 *   - The tabs navigator owns its own layout, header logic, and safe-area
 *     handling. Duplicating that here would cause a flash or layout mismatch.
 *   - <Redirect> replaces the current history entry, so pressing Back on
 *     the home screen does not bring the user back to a blank index screen.
 */
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
