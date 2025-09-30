// Test setup file
process.env.NODE_ENV = 'test';

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
