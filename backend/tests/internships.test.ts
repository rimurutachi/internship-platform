import request from 'supertest';

// Force test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost/fake';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-key';

// Mock auth middleware to bypass Supabase verification
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, _res: any, next: any) => {
        // Attach a mock user for any request with a Bearer token
        const auth = req.headers['authorization'] || '';
        if (auth.startsWith('Bearer ')) {
            req.user = {
                id: 'test-user-id',
                email: 'test@example.com',
                role: 'admin',
            };
        }
        next();
    },
    requireRole: (_roles: string[]) => (_req: any, _res: any, next: any) => next(),
}));

// Mock notificationService (named + default export for archiveService compatibility)
jest.mock('../src/services/notificationService', () => {
    const mockInstance = {
        createNotification: jest.fn(async () => ({})),
        getUserNotifications: jest.fn(async () => []),
        getUnreadNotificationsCount: jest.fn(async () => 0),
        markAsRead: jest.fn(async () => undefined),
        markAllAsRead: jest.fn(async () => undefined),
        deleteNotification: jest.fn(async () => undefined),
    };
    return {
        __esModule: true,
        NotificationService: jest.fn(() => mockInstance),
        default: mockInstance,
    };
});

// Import app AFTER mocks
import app from '../src/server';

describe('Internship APIs', () => {
    let authToken: string;
    let internshipId: string;

    beforeAll(async () => {
        // Use a static token; auth middleware is mocked to accept any Bearer token
        authToken = 'test-token';
    });

    test('POST /api/internships - Create Internship', async () => {
        const response = await request(app)
            .post('/api/internships')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                student_id: 'student-uuid',
                company_id: 'company-uuid',
                advisor_id: 'advisor-uuid',
                position: 'Software Developer Intern',
                start_date: '2025-07-29',
                end_date: '2025-09-12'
            });
        
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id');

        internshipId = response.body.data.id;
    });

    test('GET /api/internships/:id - Get Internship', async () => {
        const response = await request(app)
            .get(`/api/internships/${internshipId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true)
        expect(response.body.data.position).toBe('Software Developer Intern');
    });

    test('GET /api/internships - Get All Internships', async () => {
        const response = await request(app)
            .get('/api/internships')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('PUT /api/internships/:id - Update Internship', async () => {
        const response = await request(app)
            .put(`/api/internships/${internshipId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'active'
            });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('active');
    });
});