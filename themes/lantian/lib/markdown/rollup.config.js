import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupCommonJS from '@rollup/plugin-commonjs';

export default {
  input: 'esmodule.js',
  output: {
    file: 'index.js',
    format: 'cjs',
  },
  plugins: [rollupCommonJS(), rollupNodeResolve()],
};
