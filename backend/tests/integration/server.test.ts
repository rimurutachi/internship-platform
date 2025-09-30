import request from 'supertest';
import app from '../../src/server';

describe('Server Health Check', () => {
    afterAll(async () => {
        // Clean up any remaining handles
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('GET /health should return OK status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body).toMatchObject({
            status: 'OK',
            message: 'Intern-Galing API is running smoothly.'
        });
    });

    test('GET /nonexistent should return 404', async () => {
        const response = await request(app)
            .get('/nonexistent-route')
            .expect(404);
    });
});