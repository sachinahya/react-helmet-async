module.exports = {
  extends: ['kyt', 'plugin:react/jsx-runtime'],

  rules: {
    'react/static-property-placement': 0,
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    'no-undef': 0,
    'react/require-default-props': 0,
    'react/jsx-filename-extension': 0,
    'prettier/prettier': 0,
    'comma-dangle': 0,
    'no-unused-vars': 0,
    'no-restricted-syntax': 0,
    'no-use-before-define': 0,
    'no-continue': 0,
    'no-cond-assign': 0,
    'no-loop-func': 0,
    'react/prop-types': 0,
    'max-classes-per-file': 0,
    'react/no-unused-prop-types': 0,
    'react/default-props-match-prop-types': 0,
    'prefer-object-spread': 0,
  },

  overrides: [
    {
      files: ['*.test.?(c|m)?(j|t)?s?(x)'],
      rules: {
        'react/jsx-props-no-spreading': 0,
        'react/no-unknown-property': 0,
        'react/jsx-no-useless-fragment': 0,
      },
    },
  ],
};
