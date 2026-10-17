<p align="center">
  <strong>✈️ 伝わる日本語を、短く自然に。</strong>
</p>

<p align="center">
  SimpleJapanese は、読み手に合わせて日本語の文章を分かりやすく整えるエージェントスキルです。<br>
  意味や事実を保ちながら、構成、語彙、文の長さ、丁寧さを調整します。<br>
  技術文書、手順書、案内、説明、翻訳などに使えます。
</p>

<p align="center">
  <a href="https://agentskills.io"><img src="https://img.shields.io/badge/SKILL.md-open_standard-blue?style=flat" alt="Agent Skills"></a>
  <a href="skills/simple-japanese/SKILL.md"><img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat" alt="バージョン1.0.0"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat" alt="MIT"></a>
</p>

## インストール

[skills CLI](https://github.com/vercel-labs/skills)でスキルをインストールします。

```bash
npx skills add fammet-h/SimpleJapanese
```

フックには Node.js が必要です。詳しくは [`src/hooks/README.md`](src/hooks/README.md) をご覧ください。

スキルに対応していない場合は、[`prompts/system-prompt.md`](prompts/system-prompt.md) のルールをシステムプロンプト、`AGENTS.md`、または `.cursorrules` に貼り付けてください。

## 基本方針

- 読者と目的に合う語彙と説明を選びます。
- 条件、主体、数値、因果関係を保ちます。
- 手順では前提を先に示し、操作を一つずつ書きます。
- 固有名詞、コード、コマンド、パス、引用は、変更を求められない限り保ちます。
- 不明な事実を推測で補いません。
- 文体は指定がなければ自然な「です・ます」調にします。

## 上流プロジェクトと評価データ

このリポジトリは [AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish) からフォークし、日本語文書向けに作り直しています。上流の評価データは英語の文章作成支援を測ったものです。その数値は SimpleJapanese の品質を示すものではありません。記録を保つために残した評価データの説明は [`evals/README.md`](evals/README.md) をご覧ください。

## 貢献

質問や不具合の報告、プルリクエストを歓迎します。変更内容と、必要に応じて確認方法を記載してください。

## ライセンス

このリポジトリはMITライセンスです。ASD-STE100 に関する上流の説明や評価は、SimpleJapanese が同規格に準拠または認証されていることを意味しません。
