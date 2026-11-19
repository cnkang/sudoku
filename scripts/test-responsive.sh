#!/bin/bash

# 响应式测试脚本
echo "🧪 Running Responsive Tests for Sudoku Game"
echo "=========================================="

# 运行所有响应式测试
echo "📱 Running mobile and responsive component tests..."
pnpm exec vitest run --reporter=verbose \
  src/components/__tests__/*.responsive.test.tsx \
  src/app/__tests__/*.responsive.test.tsx

# 检查测试结果
if [[ $? -eq 0 ]]; then
  echo "✅ All responsive tests passed!"
else
  echo "❌ Some responsive tests failed!"
  exit 1
fi

echo ""
echo "🎯 Running coverage for responsive components..."
pnpm exec vitest run --coverage \
  src/components/__tests__/GameControls.responsive.test.tsx \
  src/app/__tests__/page.responsive.test.tsx

echo ""
echo "📊 Test Summary:"
echo "- Mobile viewport tests"
echo "- Tablet layout tests" 
echo "- Touch device optimizations"
echo "- Landscape orientation tests"
echo "- CSS media query coverage"
echo "- Accessibility on mobile"
echo ""
echo "🎉 Responsive testing complete!"
