import React, { useEffect } from 'react';
import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';

export function ConsentGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (async () => {
      try {
        const info = await AdsConsent.requestInfoUpdateAsync();
        if (
          info.isConsentFormAvailable &&
          info.status === AdsConsentStatus.REQUIRED
        ) {
          await AdsConsent.showFormAsync();
        }
      } catch {
        // Consent form unavailable or not required in this region — proceed without it
      }
    })();
  }, []);

  return <>{children}</>;
}
