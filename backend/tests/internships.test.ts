import request from 'supertest';
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