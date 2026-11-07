/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Room for one shrunk photo per form (Vercel's own limit is 4.5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
