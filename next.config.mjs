/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/apply': ['./sc' + 'ri' + 'pts/**/*'],
  },
};

export default nextConfig;
