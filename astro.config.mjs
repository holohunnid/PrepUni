// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Course content lives in src/courses/ as HTML fragments; their $...$ math is
// rendered to KaTeX markup at build time by src/lib/math.js. MDX keeps the same
// build-time KaTeX via remark-math + rehype-katex, for chapters written in Markdown.
export default defineConfig({
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  // fetch a page as soon as its link is hovered or tapped, so moving between
  // modules feels instant
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
