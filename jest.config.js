module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["<rootDir>/src/"],
  testMatch: ["**/?(*.)+(spec|test).[t]s?(x)"], //only match ts files
};