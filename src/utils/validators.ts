export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAdTitle(title: string): ValidationResult {
  const t = title.trim();
  if (!t) return { valid: false, error: 'Title is required' };
  if (t.length < 5) return { valid: false, error: 'Title must be at least 5 characters' };
  if (t.length > 100) return { valid: false, error: 'Title must be 100 characters or less' };
  return { valid: true };
}

export function validateAdDescription(desc: string): ValidationResult {
  const d = desc.trim();
  if (!d) return { valid: false, error: 'Description is required' };
  if (d.length < 20) return { valid: false, error: 'Please add more details (min 20 characters)' };
  if (d.length > 2000) return { valid: false, error: 'Description must be 2000 characters or less' };
  return { valid: true };
}

export function validateAdPrice(price: number | string): ValidationResult {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return { valid: false, error: 'Enter a valid price' };
  if (num < 0) return { valid: false, error: 'Price cannot be negative' };
  if (num > 99_999_999) return { valid: false, error: 'Price is too high' };
  return { valid: true };
}

export function validateAdImages(count: number): ValidationResult {
  if (count < 1) return { valid: false, error: 'Add at least one photo' };
  if (count > 8) return { valid: false, error: 'Maximum 8 photos allowed' };
  return { valid: true };
}

export function validateLocation(location: string): ValidationResult {
  if (!location.trim()) return { valid: false, error: 'Location is required' };
  return { valid: true };
}

export function validateReviewRating(rating: number): ValidationResult {
  if (rating < 1) return { valid: false, error: 'Please select a rating' };
  if (rating > 5) return { valid: false, error: 'Rating must be between 1 and 5' };
  if (!Number.isInteger(rating)) return { valid: false, error: 'Rating must be a whole number' };
  return { valid: true };
}

export function validateReviewComment(comment: string): ValidationResult {
  const c = comment.trim();
  if (c.length < 10) return { valid: false, error: 'Review must be at least 10 characters' };
  if (c.length > 500) return { valid: false, error: 'Maximum 500 characters' };
  return { valid: true };
}
