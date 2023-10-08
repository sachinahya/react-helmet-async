module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.?(c|m)(j|t)s(x)?'],
  prettierPath: require.resolve('prettier-2'),
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
};
