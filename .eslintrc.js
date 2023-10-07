module.exports = {
  extends: ['kyt'],

  rules: {
    'react/static-property-placement': 0,
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    'no-undef': 0,
    'react/require-default-props': 0,
    'react/jsx-filename-extension': 0,
    'prettier/prettier': 0,
  },

  overrides: [
    {
      files: ['*.test.js'],
      rules: {
        'react/jsx-props-no-spreading': 0,
        'react/no-unknown-property': 0,
      },
    },
  ],
};
