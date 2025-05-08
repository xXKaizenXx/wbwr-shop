module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./src'],
            alias: {
              '@api': './src/api',
              '@components': './src/components',
              '@constants': './src/constants',
              '@navigation': './src/navigation',
              '@screens': './src/screens',
              '@types': './src/types',
              '@utils': './src/utils'
            }
          }
        ]
      ]
    };
  };
  