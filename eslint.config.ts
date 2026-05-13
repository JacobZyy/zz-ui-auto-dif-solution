import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  isInEditor: false,
  unocss: true,
  ignores: ['.claude/**', '.omc/**', 'eslint.config.ts'],
}).append({
  rules: {
    'no-console': 'warn',
    'ts/no-use-before-define': 'warn',
    'react/no-implicit-key': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
})
