import { defineConfig } from 'vite';

// Auto-detect GitHub Pages base path on CI. Locally, keep base '/'.
// On GitHub Actions, GITHUB_REPOSITORY is like 'owner/repo'.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || '';
const isCI = !!process.env.GITHUB_ACTIONS;

export default defineConfig(({ mode }) => ({
  base: isCI ? `/${repoName}/` : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));


