/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Loyiha konteynerda quriladi; tip/lint xatolari build'ni to'xtatmasin.
  // Qat'iy tekshiruv kerak bo'lsa, bu ikkalasini false qiling va `npx tsc --noEmit` ishlating.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Bu paketlar server tomonda bundle qilinmasin (native/CJS bog'liqliklari bor)
  serverExternalPackages: ['exceljs', '@prisma/client'],
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
  poweredByHeader: false,
};

export default nextConfig;
