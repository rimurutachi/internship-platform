module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tests/tsconfig.json' }],
  },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/**/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    // Add timeout to prevent hanging
    testTimeout: 10000,
    // Set NODE_ENV to test
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    globalTeardown: '<rootDir>/tests/teardown.ts',
    // Mock modules that are incompatible with Jest's CJS transform or
    // cause circular dependency issues during tests
    moduleNameMapper: {
      // isomorphic-dompurify → jsdom → @exodus/bytes (ESM-only) breaks Jest
      '^isomorphic-dompurify$': '<rootDir>/tests/__mocks__/isomorphic-dompurify.ts',
      // Socket emitters import `io` from server creating circular deps
      '^(.*)/socket/emitters$': '<rootDir>/tests/__mocks__/socketEmitters.ts',
      // Socket config tries to create a real Socket.io server
      '^(.*)/socket/socketConfig$': '<rootDir>/tests/__mocks__/socketConfig.ts',
    },
  };