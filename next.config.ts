import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hhpvymgwuonvzqbflfqz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
    // 画像フォーマット最適化（WebP, AVIF）
    formats: ['image/avif', 'image/webp'],
    // デバイスサイズ設定
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 画像サイズ設定
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // コンパイラ最適化
  compiler: {
    // 本番環境でconsole削除
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 実験的機能
  experimental: {
    // Server Actions最適化
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack設定（空でOK、webpackとの併用を許可）
  turbopack: {},

  // バンドル分析（環境変数で有効化）
  // 注: npm run analyze を実行する際は --webpack フラグが必要
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true' && !isServer) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-analysis/client.html',
        })
      );
    }
    return config;
  },

  // セキュリティヘッダー設定
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
