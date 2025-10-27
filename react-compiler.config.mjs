/** @type {import('babel-plugin-react-compiler').ReactCompilerConfig} */
const ReactCompilerConfig = {
  compilationMode: 'annotation',
  sources: filename => {
    return filename.includes('src/');
  },
  exclude: [/node_modules/, /\.test\./, /\.spec\./, /e2e/],
  // Enhanced React Compiler optimizations
  enableTreatRefLikeIdentifierInHoist: true,
  enableTreatFunctionDepsAsConditional: true,
  enablePreserveExistingMemoizationGuarantees: true,
  enableReactiveScopesInHIR: true,
  // Target modern environments for better optimizations
  target: '19',
};

export default ReactCompilerConfig;
