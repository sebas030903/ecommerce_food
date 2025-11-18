/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    domains: [
      'localhost',
      'res.cloudinary.com',
      'i.imgur.com',
      'images.unsplash.com',
      'cdn.pixabay.com',
    ],
  },
  output: "standalone",
};

module.exports = nextConfig;
