/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['app', 'core', 'engine', 'mac', 'ui', 'eval', 'site', 'docs', 'ci', 'repo', 'deps', 'design']],
    'body-max-line-length': [1, 'always', 200],
  },
}
