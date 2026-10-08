const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', '.expo/**', 'node_modules/**', 'work/**'] },
  {
    files: ['app/**/*.tsx', 'src/features/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['warn',
        { selector: 'Literal[value=/^#(?:[\\da-f]{3}|[\\da-f]{4}|[\\da-f]{6}|[\\da-f]{8})$/i]', message: 'Use a shared color token instead of a hard-coded hex color.' },
        { selector: "Property[key.name='fontSize'][value.type='Literal']", message: 'Use a shared typography token instead of an inline fontSize value.' },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: 'Literal[value=/^#(?:[\\da-f]{3}|[\\da-f]{4}|[\\da-f]{6}|[\\da-f]{8})$/i]', message: 'Use a shared color token instead of a hard-coded hex color.' },
        { selector: "Property[key.name='fontSize'][value.type='Literal']", message: 'Use a shared typography token instead of an inline fontSize value.' },
      ],
    },
  },
]);
