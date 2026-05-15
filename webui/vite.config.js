import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The Hermes Python server serves everything under /static/ from the
// sibling `static/` directory. We build the React bundle directly into
// `static/nixon-workspace/` so the existing URL (nixon-workspace.html)
// keeps working without any server-side route changes.
//
// `base` MUST be relative ("./") so the generated index.html loads its
// hashed JS/CSS via paths like `./assets/index-*.js`, which works whether
// the Hermes server is mounted at `/` or at a subpath like `/session/`.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../static/nixon-workspace'),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
  },
});
