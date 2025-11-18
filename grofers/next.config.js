/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    domains: [
      "localhost",
      "res.cloudinary.com",
      "i.imgur.com",
      "images.unsplash.com",
      "cdn.pixabay.com",
    ],
  },
  experimental: {
    serverActions: false,
  },
  // 🚀 ESTE ES EL FIX DEFINITIVO
  generateStaticParams: () => [],
};

export default nextConfig;
