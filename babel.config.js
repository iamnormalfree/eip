// ABOUTME: Babel configuration for EIP test infrastructure
// ABOUTME: Handles TypeScript, React JSX transformation for Next.js and Jest

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
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
      }
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        development: process.env.NODE_ENV !== 'production',
        importSource: undefined,
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-flow',
    '@babel/plugin-transform-runtime'
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
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic',
            development: true,
            importSource: undefined,
          }
        ]
      ],
      plugins: [
        '@babel/plugin-syntax-flow',
        '@babel/plugin-transform-runtime'
      ]
    },
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ],
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic',
            development: true,
            importSource: undefined,
          }
        ]
      ],
      plugins: [
        '@babel/plugin-syntax-flow',
        '@babel/plugin-transform-runtime'
      ]
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ],
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
          }
        ],
        [
          '@babel/preset-react',
          {
            runtime: 'automatic',
            development: false,
            importSource: undefined,
          }
        ]
      ],
      plugins: [
        '@babel/plugin-syntax-flow',
        '@babel/plugin-transform-runtime'
      ]
    }
  }
};