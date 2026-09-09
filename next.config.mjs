/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // RFQ technical file uploads (STEP/DXF/PDF) can be a few MB each.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
