import { ReportReasonId } from '../types';

export interface ReportReasonDef {
  id: ReportReasonId;
  label: string;
}

export const REPORT_REASONS: ReportReasonDef[] = [
  { id: 'SPAM', label: 'Spam or misleading' },
  { id: 'PROHIBITED_ITEM', label: 'Prohibited item' },
  { id: 'SCAM', label: 'Suspected scam' },
  { id: 'WRONG_CATEGORY', label: 'Wrong category' },
  { id: 'DUPLICATE', label: 'Duplicate listing' },
  { id: 'OFFENSIVE', label: 'Offensive content' },
  { id: 'OTHER', label: 'Other' },
];
