/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = (process.env.API_URL ?? "http://localhost:8000").trim();
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
