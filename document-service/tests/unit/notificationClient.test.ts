import axios from 'axios';

const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
  })),
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import notificationClient from '../../src/services/notificationClient';

describe('DocumentNotificationClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts notifications to backend internal endpoint when reachable', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: { success: true } });

    await notificationClient.sendNotification({
      user_id: 'student-1',
      type: 'document_template_uploaded',
      title: 'New Template',
      message: 'Advisor uploaded MOA template',
      action_url: '/dashboard/student/documents',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/communications/notifications/internal'),
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            user_id: 'student-1',
            type: 'document_template_uploaded',
          }),
        ]),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-internal-service-key': expect.any(String),
        }),
      })
    );
  });

  it('falls back to direct Supabase insert if backend internal API fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const insertMock = jest.fn().mockResolvedValueOnce({ error: null });
    mockFrom.mockReturnValue({ insert: insertMock });

    await notificationClient.sendBulkNotifications([
      {
        user_id: 'advisor-1',
        type: 'document_submitted',
        title: 'Submitted for Pre-Approval',
        message: 'Student submitted MOA',
        action_url: '/dashboard/advisor/documents/doc-1',
      },
    ]);

    expect(mockFrom).toHaveBeenCalledWith('notifications');
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'advisor-1',
        type: 'document_submitted',
        is_read: false,
      }),
    ]);
  });

  it('unions internship students and pre-assigned profile students in getAdvisorStudentIds', async () => {
    const internshipInMock = jest.fn().mockResolvedValue({
      data: [{ student_id: 's-1' }, { student_id: 's-2' }],
      error: null,
    });
    const internshipEqMock = jest.fn().mockReturnValue({ in: internshipInMock });

    const profileFilterMock = jest.fn().mockResolvedValue({
      data: [{ id: 's-2' }, { id: 's-3' }],
      error: null,
    });
    const profileEqStatus = jest.fn().mockReturnValue({ filter: profileFilterMock });
    const profileEqRole = jest.fn().mockReturnValue({ eq: profileEqStatus });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: jest.fn().mockReturnValue({ eq: internshipEqMock }) };
      }
      if (table === 'users') {
        return { select: jest.fn().mockReturnValue({ eq: profileEqRole }) };
      }
      return {};
    });

    const ids = await notificationClient.getAdvisorStudentIds('adv-1');
    expect(ids).toEqual(['s-1', 's-2', 's-3']);
  });

  it('resolves assigned advisor from active internship or profile_data fallback', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const limitMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
    const inMock = jest.fn().mockReturnValue({ order: orderMock });
    const eqStudentMock = jest.fn().mockReturnValue({ in: inMock });

    const userMaybeSingle = jest.fn().mockResolvedValue({
      data: { profile_data: { assigned_advisor_id: 'adv-fallback' } },
      error: null,
    });
    const userEqMock = jest.fn().mockReturnValue({ maybeSingle: userMaybeSingle });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: jest.fn().mockReturnValue({ eq: eqStudentMock }) };
      }
      if (table === 'users') {
        return { select: jest.fn().mockReturnValue({ eq: userEqMock }) };
      }
      return {};
    });

    const advisorId = await notificationClient.getStudentAdvisorId('student-99');
    expect(advisorId).toBe('adv-fallback');
  });
});
