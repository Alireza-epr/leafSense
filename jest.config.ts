import type { Config } from 'jest';

const config: Config = {
  roots: ['./tests'],
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.app.json' 
    }
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
};

export default config;
