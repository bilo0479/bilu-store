import { NotificationType } from '../types';

export interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  bodyTemplate: string;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { type: 'NEW_MESSAGE', titleTemplate: 'New message from {senderName}', bodyTemplate: '{messagePreview}' },
  { type: 'AD_APPROVED', titleTemplate: 'Your ad is live!', bodyTemplate: '"{adTitle}" is now visible to buyers' },
  { type: 'AD_REJECTED', titleTemplate: 'Ad not approved', bodyTemplate: '"{adTitle}" needs changes. Tap to see why.' },
  { type: 'AD_INTEREST', titleTemplate: 'Someone is interested!', bodyTemplate: '{buyerName} wants to chat about "{adTitle}"' },
  { type: 'PREMIUM_EXPIRING', titleTemplate: 'Boost ending soon', bodyTemplate: 'Your {tierName} boost for "{adTitle}" expires tomorrow' },
  { type: 'NEW_REVIEW', titleTemplate: 'New review received', bodyTemplate: '{reviewerName} gave you {rating} stars' },
];

export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}
