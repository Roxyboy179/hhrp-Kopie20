const nextConfig = {
  output: 'standalone',
  
  // Optimierte Bildkompression für PWA
  images: {
    unoptimized: false, // Aktiviere Bildoptimierung
    formats: ['image/webp'],
    minimumCacheTTL: 31536000, // 1 Jahr Cache
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // Kompression aktivieren
  compress: true,
  
  // Production-optimierungen
  swcMinify: true,
  
  // Aggressive Caching
  generateEtags: true,
  
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
    // optimizeCss: true, // Deaktiviert - benötigt 'critters' Package
  },
  
  webpack(config, { dev, isServer }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    
    // Production Optimierungen
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            lib: {
              test: /node_modules/,
              name: 'lib',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
      // Cache für statische Assets
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|svg|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Service Worker Cache
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
