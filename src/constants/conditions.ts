import { AdCondition } from '../types';

export interface ConditionDef {
  id: AdCondition;
  label: string;
  shortLabel: string;
}

export const CONDITIONS: ConditionDef[] = [
  { id: 'NEW', label: 'Brand New', shortLabel: 'New' },
  { id: 'LIKE_NEW', label: 'Like New', shortLabel: 'Like New' },
  { id: 'USED_GOOD', label: 'Used — Good', shortLabel: 'Used' },
  { id: 'USED_FAIR', label: 'Used — Fair', shortLabel: 'Fair' },
];

export function getConditionLabel(id: AdCondition): string {
  return CONDITIONS.find(c => c.id === id)?.label ?? id;
}
