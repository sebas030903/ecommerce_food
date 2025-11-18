/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    domains: [
      'localhost',
      'res.cloudinary.com',
      'i.imgur.com',          // ✅ para tus productos del seed
      'images.unsplash.com',  // ✅ por si luego usas Unsplash
      'cdn.pixabay.com'       // ✅ por si usas imágenes libres
    ],
  },
};

export default nextConfig;
