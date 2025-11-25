/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@metlink/ui", "@metlink/api", "@metlink/db"],
};

module.exports = nextConfig;


