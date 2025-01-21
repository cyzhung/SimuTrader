module.exports = {
    testEnvironment: 'node',
    rootDir: '../',  // 指向項目根目錄
    testMatch: [
        '<rootDir>/tests/**/*.test.js'
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
};