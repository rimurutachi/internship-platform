import {
  getNotificationVisuals,
  getRelativeTime,
  NOTIFICATION_CATEGORIES,
} from '@/lib/notifications-ui';

describe('notifications-ui helpers', () => {
  it('classifies approval, rejection, revision, message, and template types accurately', () => {
    expect(getNotificationVisuals('document_approved').tone).toBe('success');
    expect(getNotificationVisuals('document_pre_approved').tone).toBe('success');
    expect(getNotificationVisuals('evaluation_approved').tone).toBe('success');
    expect(getNotificationVisuals('internship_active').tone).toBe('success');

    expect(getNotificationVisuals('document_rejected').tone).toBe('error');
    expect(getNotificationVisuals('evaluation_rejected').tone).toBe('error');
    expect(getNotificationVisuals('internship_cancelled').tone).toBe('error');

    expect(getNotificationVisuals('document_revision_requested').tone).toBe('warning');
    expect(getNotificationVisuals('evaluation_revision_requested').tone).toBe('warning');
    expect(getNotificationVisuals('document_pre_approval_reverted').tone).toBe('warning');
    expect(getNotificationVisuals('internship_reminder').tone).toBe('warning');

    expect(getNotificationVisuals('message_received').tone).toBe('message');
    expect(getNotificationVisuals('document_template_uploaded').tone).toBe('document');
    expect(getNotificationVisuals('document_template_uploaded').category).toBe('document');
  });

  it('exposes all 6 notification filter categories', () => {
    expect(NOTIFICATION_CATEGORIES.map((c) => c.value)).toEqual([
      'all',
      'internship',
      'document',
      'evaluation',
      'message',
      'system',
    ]);
  });

  it('formats relative timestamps cleanly', () => {
    const now = new Date().toISOString();
    expect(getRelativeTime(now)).toBe('Just now');

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(getRelativeTime(tenMinsAgo)).toBe('10 min ago');
  });
});

