import { createClient } from '@supabase/supabase-js';
import notificationService from '../../../src/services/notificationService';
import {
  emitNewNotification,
  emitNotificationCountUpdate,
} from '../../../src/socket/emitters';

const mockCreateClient = createClient as jest.Mock;
const supabase =
  mockCreateClient.mock.results[mockCreateClient.mock.results.length - 1]?.value;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a notification with metadata + valid reference_id and emits real-time events', async () => {
    const validRefId = '550e8400-e29b-41d4-a716-446655440000';
    const createdNotif = {
      id: '11111111-1111-4111-8111-111111111111',
      user_id: 'user-1',
      type: 'evaluation_approved',
      title: 'Evaluation Approved',
      message: 'Your evaluation was approved.',
      action_url: '/dashboard/student/evaluations',
      reference_id: validRefId,
      reference_type: 'evaluation',
      metadata: { final_grade: 1.25 },
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const singleMock = jest.fn().mockResolvedValue({ data: createdNotif, error: null });
    const selectAfterInsert = jest.fn().mockReturnValue({ single: singleMock });
    const insertMock = jest.fn().mockReturnValue({ select: selectAfterInsert });

    const countEqRead = jest.fn().mockResolvedValue({ count: 3, error: null });
    const countEqUser = jest.fn().mockReturnValue({ eq: countEqRead });
    const countSelect = jest.fn().mockReturnValue({ eq: countEqUser });

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'notifications') {
        return {
          insert: insertMock,
          select: countSelect,
        };
      }
      return {};
    });

    const result = await notificationService.createNotification({
      user_id: 'user-1',
      type: 'evaluation_approved',
      title: 'Evaluation Approved',
      message: 'Your evaluation was approved.',
      action_url: '/dashboard/student/evaluations',
      reference_id: validRefId,
      reference_type: 'evaluation',
      metadata: { final_grade: 1.25 },
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'evaluation_approved',
        reference_id: validRefId,
        metadata: { final_grade: 1.25 },
        is_read: false,
      })
    );
    expect(result).toEqual(createdNotif);
    expect(emitNewNotification).toHaveBeenCalledWith('user-1', createdNotif);
    expect(emitNotificationCountUpdate).toHaveBeenCalledWith('user-1', 3);
  });

  it('returns empty array safely when createBulkNotifications receives empty list', async () => {
    const result = await notificationService.createBulkNotifications([]);
    expect(result).toEqual([]);
    expect(emitNewNotification).not.toHaveBeenCalled();
  });

  it('creates bulk notifications and emits persisted rows and per-user unread counts', async () => {
    const insertedRows = [
      {
        id: 'n-1',
        user_id: 'u-1',
        type: 'internship_created',
        title: 'Assigned',
        message: 'M1',
        is_read: false,
      },
      {
        id: 'n-2',
        user_id: 'u-2',
        type: 'internship_created',
        title: 'Assigned',
        message: 'M2',
        is_read: false,
      },
    ];

    const selectAfterInsert = jest
      .fn()
      .mockResolvedValue({ data: insertedRows, error: null });
    const insertMock = jest.fn().mockReturnValue({ select: selectAfterInsert });

    const countEqRead = jest.fn().mockResolvedValue({ count: 2, error: null });
    const countEqUser = jest.fn().mockReturnValue({ eq: countEqRead });
    const countSelect = jest.fn().mockReturnValue({ eq: countEqUser });

    supabase.from = jest.fn().mockReturnValue({
      insert: insertMock,
      select: countSelect,
    });

    const result = await notificationService.createBulkNotifications([
      { user_id: 'u-1', type: 'internship_created', title: 'Assigned', message: 'M1' },
      { user_id: 'u-2', type: 'internship_created', title: 'Assigned', message: 'M2' },
    ]);

    expect(result).toHaveLength(2);
    expect(emitNewNotification).toHaveBeenCalledTimes(2);
    expect(emitNotificationCountUpdate).toHaveBeenCalledWith('u-1', 2);
    expect(emitNotificationCountUpdate).toHaveBeenCalledWith('u-2', 2);
  });

  it('queries paginated notifications with category, read status, and search filters', async () => {
    const rows = [{ id: 'n-1', user_id: 'u-1', type: 'document_approved', is_read: false }];

    const rangeMock = jest.fn().mockResolvedValue({ data: rows, error: null, count: 1 });
    const orderMock = jest.fn().mockReturnValue({ range: rangeMock });
    const orMock = jest.fn().mockReturnValue({ order: orderMock });
    const inMock = jest.fn().mockReturnValue({ or: orMock });
    const eqReadMock = jest.fn().mockReturnValue({ in: inMock });
    const eqUserMock = jest.fn().mockReturnValue({ eq: eqReadMock });

    const countEqRead = jest.fn().mockResolvedValue({ count: 1, error: null });
    const countEqUser = jest.fn().mockReturnValue({ eq: countEqRead });

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn((_cols: string, opts?: any) => {
        if (opts?.head) {
          return { eq: countEqUser };
        }
        return { eq: eqUserMock };
      }),
    });

    const result = await notificationService.getUserNotificationsPaginated('u-1', {
      page: 1,
      limit: 20,
      is_read: false,
      category: 'document',
      search: 'MOA',
    });

    expect(inMock).toHaveBeenCalledWith('type', expect.arrayContaining(['document_approved', 'document_template_uploaded']));
    expect(orMock).toHaveBeenCalledWith('title.ilike.%MOA%,message.ilike.%MOA%');
    expect(result).toEqual({
      notifications: rows,
      total: 1,
      unread_count: 1,
      page: 1,
      limit: 20,
      has_more: false,
    });
  });

  it('deletes read notifications and emits updated unread count', async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: [{ id: 'n-1' }, { id: 'n-2' }], error: null });
    const eqReadMock = jest.fn().mockReturnValue({ select: selectMock });
    const eqUserMock = jest.fn().mockReturnValue({ eq: eqReadMock });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqUserMock });

    const countEqRead = jest.fn().mockResolvedValue({ count: 1, error: null });
    const countEqUser = jest.fn().mockReturnValue({ eq: countEqRead });
    const countSelect = jest.fn().mockReturnValue({ eq: countEqUser });

    supabase.from = jest.fn().mockReturnValue({
      delete: deleteMock,
      select: countSelect,
    });

    const deleted = await notificationService.deleteReadNotifications('u-1');
    expect(deleted).toBe(2);
    expect(emitNotificationCountUpdate).toHaveBeenCalledWith('u-1', 1);
  });

  it('deletes all notifications and emits count 0', async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: [{ id: 'n-1' }], error: null });
    const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqUserMock });

    supabase.from = jest.fn().mockReturnValue({
      delete: deleteMock,
    });

    const deleted = await notificationService.deleteAllNotifications('u-1');
    expect(deleted).toBe(1);
    expect(emitNotificationCountUpdate).toHaveBeenCalledWith('u-1', 0);
  });
});

