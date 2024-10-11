const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add rule for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Ensure WebAssembly files are output correctly
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';

    // Prevent node-specific globals from breaking the build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // Correct image configuration
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;