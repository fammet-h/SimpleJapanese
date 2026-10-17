const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  FALLBACK_CONTEXT,
  MAX_CHARS,
  buildContext,
  promptCandidates,
  readFirstFile,
  stripFrontmatter,
} = require('./simple-japanese-activate');

const SCRIPT = path.join(__dirname, 'simple-japanese-activate.js');
const REPO_PROMPT = path.join(__dirname, '..', '..', 'prompts', 'system-prompt.md');

function tmpRoot(promptText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'se-hook-'));
  fs.mkdirSync(path.join(root, 'prompts'));
  if (promptText !== undefined) {
    fs.writeFileSync(path.join(root, 'prompts', 'system-prompt.md'), promptText);
  }
  return root;
}

function runHook(env) {
  return spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '', ...env }, encoding: 'utf8' });
}

test('プラグインのルートにあるプロンプトを優先する', () => {
  assert.equal(promptCandidates('/plugin', '/plugin/src/hooks')[0], '/plugin/prompts/system-prompt.md');
});

test('プラグインのルートがない場合はリポジトリの配置を使う', () => {
  assert.equal(promptCandidates(undefined, '/repo/src/hooks')[0], '/repo/prompts/system-prompt.md');
});

test('読み込めない候補を飛ばし、次の候補を読む', (t) => {
  if (process.getuid && process.getuid() === 0) {
    t.skip('root 権限では mode 000 のファイルを読み込めます');
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-read-'));
  const locked = path.join(dir, 'locked.md');
  const open = path.join(dir, 'open.md');
  fs.writeFileSync(locked, 'SECRET');
  fs.chmodSync(locked, 0o000);
  fs.writeFileSync(open, 'OPEN');
  assert.equal(readFirstFile([locked, open]), 'OPEN');
  fs.chmodSync(locked, 0o644);
});

test('ディレクトリの候補を飛ばす', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-dir-'));
  const asDir = path.join(dir, 'system-prompt.md');
  fs.mkdirSync(asDir);
  const file = path.join(dir, 'real.md');
  fs.writeFileSync(file, 'REAL');
  assert.equal(readFirstFile([asDir, file]), 'REAL');
});

test('すべての候補を読み込めない場合は空文字列を返す', () => {
  assert.equal(readFirstFile(['/nonexistent/a.md', '/nonexistent/b.md']), '');
});

test('LF または CRLF の YAML frontmatter を取り除く', () => {
  assert.equal(stripFrontmatter('---\nname: x\n---\nBody'), 'Body');
  assert.equal(stripFrontmatter('---\r\nname: x\r\n---\r\nBody'), 'Body');
});

test('プロンプトがない場合は短縮ルールを使う', () => {
  assert.equal(buildContext(''), FALLBACK_CONTEXT);
});

test('同梱プロンプトは Claude Code の標準出力上限内に収まる', () => {
  const out = buildContext(fs.readFileSync(REPO_PROMPT, 'utf8'));
  assert.ok(out.length <= MAX_CHARS, `${out.length} > ${MAX_CHARS}`);
  assert.ok(out.includes('チャットでは'));
  assert.ok(!out.includes('単独利用向けシステムプロンプト'), 'ページのタイトルが含まれています');
  assert.ok(!out.includes('短縮版'), '短縮版の節が含まれています');
  assert.ok(!out.includes('貼り付けてください'), '案内文が含まれています');
  assert.ok(out.startsWith('Simple Japanese のルールを自動的に適用します。'));
});

test('長すぎるプロンプトは文の途中で切らず、短縮版を使う', () => {
  const out = buildContext('x'.repeat(MAX_CHARS + 1));
  assert.equal(out, FALLBACK_CONTEXT);
});

test('main() は CLAUDE_PLUGIN_ROOT のプロンプトを読む', () => {
  const root = tmpRoot('CLAUDE-COPY');
  const r = runHook({ CLAUDE_PLUGIN_ROOT: root });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('CLAUDE-COPY'));
});

test('main() は PLUGIN_ROOT のプロンプトを読む（Codex）', () => {
  const root = tmpRoot('CODEX-COPY');
  const r = runHook({ PLUGIN_ROOT: root });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('CODEX-COPY'));
});

test('候補がない場合は短縮版を出力して終了コード 0 を返す', () => {
  // リポジトリの配置からもプロンプトを見つけられない場所で実行します。
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'se-main-'));
  const script = path.join(dir, 'a', 'b', 'hook.js');
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.copyFileSync(SCRIPT, script);
  const root = tmpRoot(undefined);
  const r = spawnSync(process.execPath, [script], { env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: root }, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, FALLBACK_CONTEXT);
});
