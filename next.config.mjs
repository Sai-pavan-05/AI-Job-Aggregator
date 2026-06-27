/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/apply': ['./scripts/**/*'],
    },
  },
};

export default nextConfig;
