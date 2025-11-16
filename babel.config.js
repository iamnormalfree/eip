// ABOUTME: Babel configuration for EIP test infrastructure
// ABOUTME: Handles TypeScript syntax transformation for Jest

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-syntax-flow'
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ],
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-syntax-flow'
      ]
    }
  }
};