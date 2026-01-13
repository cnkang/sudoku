// React Compiler configuration for Next.js 16
interface ReactCompilerConfig {
  compilationMode: 'annotation' | 'infer';
  sources?: (filename: string) => boolean;
  exclude?: RegExp[];
  enableTreatRefLikeIdentifierInHoist?: boolean;
  enableTreatFunctionDepsAsConditional?: boolean;
  enablePreserveExistingMemoizationGuarantees?: boolean;
  enableReactiveScopesInHIR?: boolean;
  target?: string;
}

const reactCompilerConfig: ReactCompilerConfig = {
  compilationMode: 'annotation',
  sources: (filename: string) => {
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

export default reactCompilerConfig;
