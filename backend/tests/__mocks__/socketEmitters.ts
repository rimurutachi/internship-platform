/**
 * Mock for socket emitters to prevent circular imports and
 * avoid needing a real Socket.io instance during tests.
 */
export const emitNewNotification = jest.fn();
export const emitNotificationCountUpdate = jest.fn();
export const emitEvaluationUpdate = jest.fn();
