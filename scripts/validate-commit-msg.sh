#!/bin/bash
# Validate commit message format
# Follows Conventional Commits specification

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Conventional Commits pattern
# Format: type(scope?): subject
# Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
pattern="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .{1,72}$"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "❌ Invalid commit message format!"
  echo ""
  echo "Commit message must follow Conventional Commits:"
  echo "  <type>(<scope>): <subject>"
  echo ""
  echo "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build"
  echo "Subject: max 72 characters"
  echo ""
  echo "Examples:"
  echo "  feat(auth): add user login"
  echo "  fix(grid): resolve cell selection bug"
  echo "  docs: update README"
  echo ""
  echo "Your message:"
  echo "  $commit_msg"
  exit 1
fi

# Check header length (max 100 characters)
header=$(echo "$commit_msg" | head -n 1)
if [[ ${#header} -gt 100 ]]; then
  echo "❌ Commit header too long (${#header} > 100 characters)"
  exit 1
fi

echo "✅ Commit message format valid"
exit 0
