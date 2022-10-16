import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupCommonJS from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';

export default {
  input: 'src/index.js',
  output: {
    file: 'index.js',
    format: 'cjs',
  },
  plugins: [rollupCommonJS(), rollupNodeResolve(), rollupJson()],
};
