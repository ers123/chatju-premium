#!/usr/bin/env bash
# Anti-slop gate (docs/redesign-plan-doorframe.md §2).
# Scans redesigned code paths for AI-generated-UI tells. Exits 1 on any hit.
# Scope grows as pages migrate: start with df components, add paths per phase.

set -u
FAIL=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Paths under the new design system (extend as phases land)
PATHS=(
  "$ROOT/components/doorframe"
  "$ROOT/components/ui/Button.tsx"
  "$ROOT/components/ui/pencil-icons.tsx"
  "$ROOT/app/(app)/saju/input"
  "$ROOT/app/lib/i18n/doorframe.ts"
)

check() {
  local label="$1"; shift
  local pattern="$1"; shift
  local hits
  hits=$(grep -rnE "$pattern" "${PATHS[@]}" 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "✗ $label"
    echo "$hits" | head -10
    FAIL=1
  else
    echo "✓ $label"
  fi
}

echo "— anti-slop gate —"
check "transition: all 금지"            "transition:\s*all"
check "이모지 아이콘 금지"              "👶|📅|⏰|✨|🎉|🔮|🌟|💫|⭐|🙏|👦|👧|👨|👩"
check "그라데이션 텍스트 금지"          "background-clip:\s*text|text-transparent.*bg-gradient"
check "indigo/purple 그라데이션 금지"   "from-(indigo|purple|violet)-|to-(indigo|purple|violet)-"
check "ease-in 진입 금지 (ease-in-out은 허용)" "[^-]ease-in[^-]"
check "scale\\(0\\) 진입 금지"          "scale\(0\)[^.]"
check "인라인 grid 스타일 금지 (레거시 오버라이드 충돌)" "style=\{\{[^}]*gridTemplateColumns"

# globals.css df-section only: no new attribute-selector hacks
if grep -nE '^\s*\[style\*' "$ROOT/app/globals.css" | awk -F: '$1 > 0' >/dev/null; then
  DEPRECATED_LINE=$(grep -n "DEPRECATED (redesign 2026-08)" "$ROOT/app/globals.css" | cut -d: -f1)
  FIRST_HACK=$(grep -nE '^\s*\[style\*' "$ROOT/app/globals.css" | head -1 | cut -d: -f1)
  if [ -n "$DEPRECATED_LINE" ] && [ "$FIRST_HACK" -gt "$DEPRECATED_LINE" ]; then
    echo "✓ attribute-selector 해킹은 deprecated 블록 내부에만 존재"
  else
    echo "✗ deprecated 블록 밖에 attribute-selector 해킹 발견"
    FAIL=1
  fi
fi

if [ $FAIL -eq 1 ]; then
  echo "— FAILED —"
  exit 1
fi
echo "— PASSED —"
