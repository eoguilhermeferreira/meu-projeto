/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repoName = 'meu-projeto'

const nextConfig = {
  output: 'export',
  // GitHub Pages serve de /<repo-name>/ em repos de projeto
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  trailingSlash: true,
  images: {
    // next/image não funciona no modo estático sem um loader customizado
    unoptimized: true,
  },
}

export default nextConfig
