import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

describe('Database Connection', () => {
    test('Should connect to Supabase', async () => {
        // Test basic connection by selecting a single record
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        expect(error).toBeNull();
        expect(data).toBeDefined();
    });

    test('Should count records in users table', async () => {
        // Test counting records using Supabase's count functionality
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        expect(error).toBeNull();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});