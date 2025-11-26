/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Increase middleware client body size for large file uploads
  middlewareClientMaxBodySize: "50mb",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bwnjplrvmxmdixjwnvgd.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;