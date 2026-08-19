import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // React 19 removed act from react-dom/test-utils - redirect to react directly
    '^react-dom/test-utils$': '<rootDir>/__mocks__/react-dom-test-utils.js',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/.legacy/', '<rootDir>/e2e/', '<rootDir>/__tests__/fixtures/'],
}

export default createJestConfig(config)
