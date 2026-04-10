/** @type {import('next').NextConfig} */
const repoName = 'meu-projeto'
const isGithubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? `/${repoName}` : '',
  assetPrefix: isGithubPages ? `/${repoName}/` : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
