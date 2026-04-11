import { CategoryId } from '../types';
import { COLORS } from './colors';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'ELECTRONICS', label: 'Electronics', icon: 'phone-portrait-outline', color: COLORS.CAT_ELECTRONICS },
  { id: 'VEHICLES', label: 'Vehicles', icon: 'car-outline', color: COLORS.CAT_VEHICLES },
  { id: 'REAL_ESTATE', label: 'Real Estate', icon: 'home-outline', color: COLORS.CAT_REAL_ESTATE },
  { id: 'FASHION', label: 'Fashion', icon: 'shirt-outline', color: COLORS.CAT_FASHION },
  { id: 'HOME_FURNITURE', label: 'Home & Furniture', icon: 'bed-outline', color: COLORS.CAT_HOME_FURNITURE },
  { id: 'JOBS', label: 'Jobs', icon: 'briefcase-outline', color: COLORS.CAT_JOBS },
  { id: 'SERVICES', label: 'Services', icon: 'construct-outline', color: COLORS.CAT_SERVICES },
  { id: 'EDUCATION', label: 'Education', icon: 'school-outline', color: COLORS.CAT_EDUCATION },
  { id: 'SPORTS', label: 'Sports', icon: 'football-outline', color: COLORS.CAT_SPORTS },
  { id: 'OTHER', label: 'Other', icon: 'grid-outline', color: COLORS.CAT_OTHER },
];

export function getCategoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
