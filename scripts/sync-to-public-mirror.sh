#!/usr/bin/env bash
#
# scripts/sync-to-public-mirror.sh
#
# 一次性同步脚本：把 ui_diff_plugins 仓库的当前工作区内容（不含 git 历史、不含 docs/）
# 推送到公开镜像仓库（默认 main 分支，强制覆盖）。
#
# 设计要点
# ------------------------------------------------------------------
# - 不动原仓库的 .git，不在原仓库添加 remote，不修改原仓库任何提交或路径。
# - 在系统临时目录里做"全量拷贝 -> git init -> 单次 commit -> push"。
# - 推送策略为 --force：把"当前工作区快照"完整落到目标分支，目标历史会被丢弃。
# - 默认排除：
#     .git/ docs/ .claude/ node_modules/ dist/ build/ .DS_Store .omc/ .idea/
#     .vscode/ .codex/ .windsurf/ development/ *.log *.tsbuildinfo
# - 鉴权完全依赖本机的 git credential helper / SSH agent，脚本不存任何凭据。
#
# 运行
# ------------------------------------------------------------------
#   bash scripts/sync-to-public-mirror.sh
#   # 或
#   ./scripts/sync-to-public-mirror.sh
#
# ------------------------------------------------------------------

set -euo pipefail

TARGET_REMOTE="https://github.com/JacobZyy/zz-ui-auto-dif-solution.git"
TARGET_BRANCH="main"

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d "/tmp/zz-ui-sync.XXXXXX")"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

EXCLUDES=(
  --exclude='.git/'
  --exclude='docs/'
  --exclude='.claude/'
  --exclude='node_modules/'
  --exclude='dist/'
  --exclude='build/'
  --exclude='.DS_Store'
  --exclude='.omc/'
  --exclude='.idea/'
  --exclude='.vscode/'
  --exclude='.codex/'
  --exclude='.windsurf/'
  --exclude='development/'
  --exclude='*.log'
  --exclude='*.tsbuildinfo'
)

log() { printf '==[sync]== %s\n' "$*"; }

log "源目录:    $SOURCE_ROOT"
log "临时目录:  $TMP_DIR"
log "目标仓库:  $TARGET_REMOTE"
log "目标分支:  $TARGET_BRANCH (force push, 历史会被覆盖)"

# 1) 拷贝工作区到临时目录
log "复制工作区到临时目录 (rsync 排除 docs / 构建产物 / 依赖)..."
rsync -a "${EXCLUDES[@]}" "$SOURCE_ROOT"/ "$TMP_DIR"/

cd "$TMP_DIR"

# 2) 初始化一个全新仓库（与源仓库 git 完全无关）
log "初始化全新 git 仓库..."
git init -q
git checkout -q -b "$TARGET_BRANCH" 2>/dev/null || git switch -q -c "$TARGET_BRANCH"

# 本地提交身份，优先复用源仓库的配置，缺省时兜底
LOCAL_NAME="$(git -C "$SOURCE_ROOT" config user.name  2>/dev/null || true)"
LOCAL_EMAIL="$(git -C "$SOURCE_ROOT" config user.email 2>/dev/null || true)"
git config user.name  "${LOCAL_NAME:-zz-sync-bot}"
git config user.email "${LOCAL_EMAIL:-sync-bot@local}"

git remote add origin "$TARGET_REMOTE"

git add -A
git commit -q -m "chore: sync from ui_diff_plugins working tree @ $TIMESTAMP"

# 3) 推送（强制覆盖目标分支）
log "推送到 $TARGET_REMOTE ($TARGET_BRANCH) ..."
git push -u origin "$TARGET_BRANCH" --force

log "完成。临时目录保留在: $TMP_DIR"
log "（确认无误后可手动执行: rm -rf \"$TMP_DIR\"）"
