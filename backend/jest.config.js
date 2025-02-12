module.exports = {
    testEnvironment: 'node',
    rootDir: './',  // 修改為當前目錄
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/backend/src/$1'  // 源代碼路徑別名
    },
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
    detectOpenHandles: true,
};