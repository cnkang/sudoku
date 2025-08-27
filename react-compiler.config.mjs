/** @type {import('babel-plugin-react-compiler').ReactCompilerConfig} */
const ReactCompilerConfig = {
  compilationMode: 'annotation',
  sources: filename => {
    return filename.includes('src/');
  },
  exclude: [/node_modules/, /\.test\./, /\.spec\./],
  enableTreatRefLikeIdentifierInHoist: true,
  enableTreatFunctionDepsAsConditional: true,
};

export default ReactCompilerConfig;
