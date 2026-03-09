/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BACKEND_URL ?? 'http://localhost:8080'}/api/:path*`,
      },
      {
        source: '/go/:path*',
        destination: `${process.env.API_BACKEND_URL ?? 'http://localhost:8080'}/go/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
