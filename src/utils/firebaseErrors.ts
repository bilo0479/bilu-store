const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/invalid-phone-number': 'Invalid phone number',
  'auth/email-already-in-use': 'Email already in use',
  'auth/wrong-password': 'Wrong password',
  'auth/user-not-found': 'No account found with this email',
  'auth/network-request-failed': 'Network error — check your connection',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password is too weak',
  'auth/operation-not-allowed': 'This sign-in method is not enabled',
  'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method',
  'auth/credential-already-in-use': 'This credential is already associated with another account',
  'auth/requires-recent-login': 'Please sign in again to complete this action',
  'auth/invalid-credential': 'Invalid credentials. Please try again',
  'auth/user-disabled': 'This account has been disabled',
  'auth/expired-action-code': 'This link has expired. Please request a new one',
  'auth/invalid-action-code': 'This link is invalid. Please request a new one',
  'auth/missing-phone-number': 'Please enter a phone number',
  'auth/invalid-verification-code': 'Invalid verification code',
  'auth/code-expired': 'Verification code has expired. Please request a new one',
};

export function mapAuthError(code: string): string {
  return AUTH_ERROR_MAP[code] ?? 'Something went wrong. Please try again.';
}
