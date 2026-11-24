import type { NotificationCategory } from '@/lib/api/notifications';

export type NotificationTone =
  | 'success'
  | 'error'
  | 'warning'
  | 'message'
  | 'document'
  | 'info';

export interface NotificationVisuals {
  tone: NotificationTone;
  category: Exclude<NotificationCategory, 'all'>;
  categoryLabel: string;
  borderClass: string;
  badgeClass: string;
}

export const NOTIFICATION_CATEGORIES: Array<{
  value: NotificationCategory;
  label: string;
}> = [
  { value: 'all', label: 'All Categories' },
  { value: 'internship', label: 'Internships' },
  { value: 'document', label: 'Documents & DTR' },
  { value: 'evaluation', label: 'Evaluations' },
  { value: 'message', label: 'Messages' },
  { value: 'system', label: 'Account & System' },
];

export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const created = new Date(timestamp);
  if (Number.isNaN(created.getTime())) return '';

  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) {
    const hrs = Math.floor(diffInSeconds / 3600);
    return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  return created.toLocaleDateString();
}

export function getNotificationCategory(type: string): {
  category: Exclude<NotificationCategory, 'all'>;
  categoryLabel: string;
} {
  const lower = (type || '').toLowerCase();

  if (lower.startsWith('internship_')) {
    return { category: 'internship', categoryLabel: 'Internship' };
  }
  if (
    lower.startsWith('document_') ||
    lower.startsWith('weekly_report_') ||
    lower === 'comment_added'
  ) {
    return { category: 'document', categoryLabel: 'Document' };
  }
  if (lower.startsWith('evaluation_')) {
    return { category: 'evaluation', categoryLabel: 'Evaluation' };
  }
  if (lower === 'message' || lower === 'message_received' || lower === 'mention') {
    return { category: 'message', categoryLabel: 'Message' };
  }
  return { category: 'system', categoryLabel: 'System' };
}

export function getNotificationTone(type: string, title: string = ''): NotificationTone {
  const lowerType = (type || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  if (
    lowerType.includes('reject') ||
    lowerType.includes('cancel') ||
    lowerType === 'account_archived' ||
    lowerType.includes('error') ||
    lowerType.includes('fail') ||
    lowerTitle.includes('rejected') ||
    lowerTitle.includes('cancelled')
  ) {
    return 'error';
  }

  if (
    lowerType.includes('approved') ||
    lowerType.includes('active') ||
    lowerType.includes('completed') ||
    lowerType.includes('verified') ||
    lowerType.includes('graduated') ||
    lowerType.includes('restored') ||
    lowerType.includes('success') ||
    lowerTitle.includes('approved') ||
    lowerTitle.includes('verified')
  ) {
    return 'success';
  }

  if (
    lowerType.includes('revision') ||
    lowerType.includes('revert') ||
    lowerType.includes('reminder') ||
    lowerType.includes('warning') ||
    lowerType.includes('overridden') ||
    lowerType.includes('update') ||
    lowerTitle.includes('revision') ||
    lowerTitle.includes('reminder')
  ) {
    return 'warning';
  }

  if (lowerType === 'message' || lowerType === 'message_received' || lowerType === 'mention') {
    return 'message';
  }

  if (lowerType.startsWith('document_') || lowerType.startsWith('weekly_report_')) {
    return 'document';
  }

  return 'info';
}

export function getNotificationVisuals(
  type: string,
  title: string = ''
): NotificationVisuals {
  const tone = getNotificationTone(type, title);
  const { category, categoryLabel } = getNotificationCategory(type);

  const borderMap: Record<NotificationTone, string> = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    message: 'border-l-sky-500',
    document: 'border-l-indigo-500',
    info: 'border-l-blue-500',
  };

  const badgeMap: Record<Exclude<NotificationCategory, 'all'>, string> = {
    internship: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    document: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    evaluation: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    message: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    system: 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300',
  };

  return {
    tone,
    category,
    categoryLabel,
    borderClass: borderMap[tone],
    badgeClass: badgeMap[category],
  };
}

