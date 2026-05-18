module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '\\.wasm$': '<rootDir>/src/__mocks__/wasm.ts',
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts',
  },
};
