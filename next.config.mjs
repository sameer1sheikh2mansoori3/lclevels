/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.EXPORT ? 'export' : undefined,
};

export default nextConfig;
