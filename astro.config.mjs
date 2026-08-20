// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// MDX is configured with build-time KaTeX so new chapters can be written in
// Markdown with $...$ math. Existing modules migrated from the original HTML
// cheat sheet live as verbatim .html fragments rendered client-side.
export default defineConfig({
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
