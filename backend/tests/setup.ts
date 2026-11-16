// Test setup file
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';

// Mock Supabase client to avoid real network calls during tests
jest.mock('@supabase/supabase-js', () => {
    const getUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
    });
    const signInWithPassword = jest.fn();
    const signOut = jest.fn();
    const createUser = jest.fn();

    // In-memory store for internships
    let internships: any[] = [];
    let idCounter = 1;

    // Generic users/companies minimal mock for joins and role checks
    const genericQuery = () => {
        const chain: any = {
            limit: (n: number) => Promise.resolve({ data: [], error: null }),
            eq: (col: string, val: unknown) => chain,
            neq: (col: string, val: unknown) => chain,
            order: () => chain,
            single: () => Promise.resolve({ data: { role: 'advisor' }, error: null }),
            maybeSingle: () => Promise.resolve({ data: { role: 'advisor' }, error: null }),
            select: () => chain,
            insert: (payload: any) => chain,
            update: (payload: any) => chain,
            delete: () => chain,
        };
        return {
            select: (columns?: string, options?: { count?: string; head?: boolean }) => {
                if (options && options.count) {
                    return Promise.resolve({ data: null, error: null, count: 0 });
                }
                return chain;
            },
            insert: (payload: any) => chain,
            update: (payload: any) => chain,
            delete: () => chain,
        };
    };

    const internshipsQuery = () => ({
        insert: (payload: any) => {
            const item = {
                id: `intern-${idCounter++}`,
                status: 'pending',
                ...payload,
            };
            internships.push(item);
            return {
                select: () => ({
                    single: () => Promise.resolve({ data: item, error: null })
                })
            };
        },
        select: (columns?: string) => {
            let result = internships.slice();
            const builder: any = {
                eq: (col: string, val: any) => {
                    result = result.filter(r => r[col] === val);
                    return builder;
                },
                order: () => builder,
                single: () => Promise.resolve({ data: result[0] || null, error: null })
            };
            return builder;
        },
        update: (updates: any) => {
            return {
                eq: (col: string, val: any) => {
                    let updated: any = null;
                    const idx = internships.findIndex(r => r[col] === val);
                    if (idx >= 0) {
                        internships[idx] = { ...internships[idx], ...updates };
                        updated = internships[idx];
                    }
                    return {
                        select: () => ({
                            single: () => Promise.resolve({ data: updated, error: null })
                        })
                    };
                }
            };
        },
        delete: () => ({
            eq: (col: string, val: any) => {
                internships = internships.filter(r => r[col] !== val);
                return Promise.resolve({ error: null });
            }
        })
    });

    const mockStorage = {
        from: jest.fn(() => ({
            upload: jest.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
            createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'http://test-signed-url.com' }, error: null }),
            getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test-public-url.com' } }),
        }))
    };

    const from = jest.fn((table: string) => {
        if (table === 'internships') return internshipsQuery();
        if (table === 'users' || table === 'companies') return genericQuery();
        return genericQuery();
    });

    return {
        createClient: jest.fn(() => ({
            auth: { 
                getUser,
                signInWithPassword,
                signOut,
                admin: { createUser }
            },
            from,
            storage: mockStorage,
        })),
    };
});

// Global test teardown
afterAll(async () => {
    // Close any open handles
    await new Promise(resolve => setTimeout(resolve, 100));
});

// Global setup to ensure clean environment
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
});

// Clean up after each test
afterEach(async () => {
    // Clear any timers
    jest.clearAllTimers();
    // Clear any mocks
    jest.clearAllMocks();
});
