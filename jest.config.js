module.exports = {
  roots: [
    "<rootDir>"
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js'
  },
  moduleFileExtensions: ['js', 'ts', 'vue', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    "^.+\\.tsx?$": "ts-jest",
    '.*\\.(vue)$': 'vue-jest'
  },
  'collectCoverage': true,
  'collectCoverageFrom': [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue'
  ]
}
