/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@spm/shared-types', '@spm/design-tokens', '@spm/validation'],
};

export default nextConfig;
