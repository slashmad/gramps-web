import {fromRollup} from '@web/dev-server-rollup'
import replace from '@rollup/plugin-replace'

const replacePlugin = fromRollup(replace)

export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  plugins: [
    replacePlugin({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('test')
    })
  ]
}
