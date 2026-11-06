# サンプル

サンプルのコードは、実際の Salesforce DX のリポジトリと同じ形の **1 つのリポジトリ**（`repository/`）にまとめている。`before/` が変更前、`after/` が変更後で、Apex・LWC・メタデータの Diff と解析は、どれもこの 2 つを比べる。動作確認のスクリプトと生成物は、種類ごとのフォルダ（`apex/`・`lwc/`・`metadata/`）に置いている。

```text
docs/examples/
├── paths.ts                     サンプルの場所 (SIDES・repositoryOf・sourceOf・apexSampleOf)。スクリプトとテストはここから引く
├── repository/
│   ├── before/                  変更前
│   │   ├── sfdx-project.json
│   │   ├── force-app/main/default/
│   │   │   ├── classes/  triggers/                Apex (Diff 用のクラス・トリガーと、構文のサンプル Parser*)
│   │   │   ├── lwc/  aura/  pages/  components/   LWC・Aura・Visualforce
│   │   │   ├── objects/  objectTranslations/      オブジェクト・翻訳
│   │   │   ├── permissionsets/  profiles/  ...    権限
│   │   │   ├── flows/  layouts/  flexipages/  labels/  tabs/  applications/  ...
│   │   │   └── reports/  dashboards/  email/  workflows/  ...
│   │   └── scripts/apex/        匿名 Apex (script.apex と、構文のサンプル parser.apex・broken.apex)
│   └── after/                   変更後 (同じ形)
├── apex/      scripts/ と output/ (Apex の JSON・Diff)
├── lwc/       scripts/ と output/ (LWC の JSON・Diff、画面モックの試作)
└── metadata/  scripts/ と output/ (オブジェクト・翻訳・フォルダ単位のメタデータの JSON・Diff・解析・レポートのデータ)
```

| 種類                               | 使う場所（`repository/<before\|after>/` の下）                                                 | 生成物                                                                                    | 実装まとめ                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Apex](./apex/README.md)           | `force-app/main/default/classes/`・`triggers/`、`scripts/apex/`                                | 単位ごとの JSON、Diff（summary・coverage）                                                | [apex-implementation.md](../apex-implementation.md)         |
| [LWC](./lwc/README.md)             | `force-app/main/default/lwc/`                                                                  | バンドルごとの JSON、Diff                                                                 | [lwc-implementation.md](../lwc-implementation.md)           |
| [メタデータ](./metadata/README.md) | `force-app/main/default/` のそのほかのフォルダ（`objects/`・`permissionsets/`・`flows/` など） | JSON と要約、Diff（summary・coverage・翻訳の網羅）、解析、レポートの data provider の出力 | [metadata-implementation.md](../metadata-implementation.md) |

```sh
# すべて作り直す
npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/apex/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/lwc/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/metadata/scripts/run-parse.ts
npx ttsx --noCheck docs/examples/metadata/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/metadata/scripts/run-folders.ts
```

- テストはサンプルのリポジトリと Diff のスクリプト（各 `scripts/run-diff.ts` の `runDiff`）を使う。生成物には依存しない。
- 変換のテスト（`test/converter`・`test/lwc_IR` など）は、1 つの時点だけを使う（LWC は `before`、Apex の構文のサンプルは `after`。構文のサンプルは before / after で同じ中身）。
- 解析の途中の段階（IR・converter の出力）は生成物として持たない。
