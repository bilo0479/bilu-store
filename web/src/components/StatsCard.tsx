import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'accent' | 'success' | 'warning' | 'info' | 'error';
  description?: string;
}

const COLOR_MAP: Record<StatsCardProps['color'], { bg: string; text: string; iconBg: string }> = {
  accent: {
    bg: 'bg-accent-light',
    text: 'text-accent-dark',
    iconBg: 'bg-accent',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-status-success',
    iconBg: 'bg-status-success',
  },
  warning: {
    bg: 'bg-orange-50',
    text: 'text-status-warning',
    iconBg: 'bg-status-warning',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-status-info',
    iconBg: 'bg-status-info',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-status-error',
    iconBg: 'bg-status-error',
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: StatsCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text-dark">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className={`mt-1 text-xs font-medium ${colors.text}`}>
              {description}
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.iconBg}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
