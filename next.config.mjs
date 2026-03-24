/** @type {import('next').NextConfig} */
const allowedOrigins = [
  'localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean)

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
