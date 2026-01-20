#!/bin/bash

# Playwright浏览器安装脚本
set -e

echo "🎭 Installing Playwright browsers..."

if [[ "$CI" = "true" ]]; then
    echo "🔧 CI: Installing Chromium only..."
    pnpm exec playwright install --with-deps chromium
else
    echo "💻 Local: Installing all browsers..."
    pnpm exec playwright install --with-deps
fi

echo "✅ Installation complete!"
