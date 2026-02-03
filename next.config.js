const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withAntdLess = require('next-plugin-antd-less');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  //swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: '/api/auth/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // webpack: (config, { isServer, webpack }) => {
  //   config.resolve.alias['@'] = path.resolve(__dirname);
  //
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       net: false,
  //       tls: false,
  //       crypto: require.resolve('crypto-browserify'),
  //     };
  //   }
  //
  //   // webpack이 정의되어 있을 때만 ProgressPlugin을 추가
  //   if (webpack && webpack.ProgressPlugin) {
  //     config.plugins.push(new webpack.ProgressPlugin());
  //   }
  //
  //   if (config.optimization && config.optimization.minimizer) {
  //     config.optimization.minimizer = config.optimization.minimizer.map((minimizer) => {
  //       if (minimizer.constructor.name === 'TerserPlugin') {
  //         return new minimizer.constructor({
  //           ...minimizer.options,
  //           terserOptions: {
  //             ...minimizer.options.terserOptions,
  //             keep_classnames: true,
  //             keep_fnames: true,
  //           },
  //         });
  //       }
  //       return minimizer;
  //     });
  //   }
  //
  //   return config;
  // },

  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },
  transpilePackages: [
    '@ant-design/icons',
    'antd',
    '@ant-design/icons-svg',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'ag-grid-community',
    'ag-grid-react',
    'ag-grid-enterprise',
  ],
};

module.exports = withBundleAnalyzer(withAntdLess(nextConfig));
