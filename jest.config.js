export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.{ts,js}'],
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol|fetch-to-node)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  testTimeout: 10000,
  globalTeardown: './jest.teardown.js',
};
