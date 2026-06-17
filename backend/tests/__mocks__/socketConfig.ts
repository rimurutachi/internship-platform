/**
 * Mock for socket config to prevent Socket.io initialization during tests.
 */
export const initializeSocket = jest.fn(() => ({
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() })),
}));
