import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set when this app is reverse-proxied under a subpath (e.g. Caddy
  // forwarding /cnc/* to this app without stripping the prefix) — see
  // NEXT_PUBLIC_BASE_PATH in deploy/README.md.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  experimental: {
    serverActions: {
      // RFQ technical file uploads (STEP/DXF/PDF) can be a few MB each.
      bodySizeLimit: "30mb",
    },
  },
};

export default withNextIntl(nextConfig);
