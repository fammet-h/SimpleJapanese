#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

// Claude Code の標準出力には上限があるため、読み込むルールの長さを制限します。
const MAX_CHARS = 9500;

const FALLBACK_CONTEXT = `Simple Japanese のルールを自動的に適用します。

読み手と目的に合う自然な日本語を書いてください。意味、事実、条件、数値を保ち、前提を示して簡潔に説明してください。固有名詞、コード、コマンド、パス、正確な引用は、変更を求められない限り保持してください。不明な事実を推測で補わないでください。`;

const HEADER = [
  'Simple Japanese のルールを自動的に適用します。',
  '',
  '利用者がスキル名を指定しなくても、以下のルールを適用してください。詳細は、このプラグインの skills/simple-japanese/SKILL.md にあります。',
  '',
].join('\n');

function candidates(pluginRoot, hookDirectory, relative) {
  const roots = [];
  if (pluginRoot) {
    roots.push(pluginRoot);
  }
  roots.push(path.join(hookDirectory, '..', '..'), path.join(hookDirectory, '..'));
  return roots.map((root) => path.join(root, ...relative));
}

function promptCandidates(pluginRoot, hookDirectory) {
  return candidates(pluginRoot, hookDirectory, ['prompts', 'system-prompt.md']);
}

function readFirstFile(list) {
  for (const candidate of list) {
    try {
      return fs.readFileSync(candidate, 'utf8');
    } catch (error) {
      // 読み込めない場合は次の候補を試します。
      // Missing, unreadable, or a directory: try the next candidate.
    }
  }
  return '';
}

function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

// 人向けの案内と、モデルに渡すルール部分を区切り線で分けています。
function ruleBlock(content) {
  const fence = /^---[ \t]*\r?$/m;
  const first = content.search(fence);
  if (first === -1) {
    return content;
  }
  const rest = content.slice(first).replace(fence, '');
  const second = rest.search(fence);
  return second === -1 ? rest : rest.slice(0, second);
}

function buildContext(promptText) {
  if (!promptText) {
    return FALLBACK_CONTEXT;
  }
  const out = HEADER + ruleBlock(stripFrontmatter(promptText)).trim();
  if (out.length > MAX_CHARS) {
    process.stderr.write(`Simple Japanese hook: ルールが上限の${MAX_CHARS}文字を超えたため、短縮版を読み込みます。\n`);
    return FALLBACK_CONTEXT;
  }
  return out;
}

function main() {
  const pluginRoot = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT;
  process.stdout.write(buildContext(readFirstFile(promptCandidates(pluginRoot, __dirname))));
}

if (require.main === module) {
  main();
}

module.exports = {
  FALLBACK_CONTEXT,
  MAX_CHARS,
  buildContext,
  promptCandidates,
  readFirstFile,
  ruleBlock,
  stripFrontmatter,
};
