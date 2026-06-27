/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/apply': ['./scripts/**/*'],
  },
};

export default nextConfig;
