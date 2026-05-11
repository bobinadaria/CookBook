import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Fail the build on type errors and lint errors (no silent surprises on Vercel)
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  async headers() {
    return [
      {
        // Allow the presentation page to embed other pages of this same site in iframes
        source: "/((?!presentation).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage — covers and step photos
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
