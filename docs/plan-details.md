# 残りの作業の実装方針（A〜I）

`docs/plan.md` 3.1「残りの推奨の進め方」の A〜G と、`docs/report-inventory.md` の提案（H: 5 章、I: 6 章の解析の揃え）ごとに、実装の方針を書きます。方針は、直すファイル・今の状態・手順・変える型と関数・新しい型と関数・テスト・終わりの条件です。2026-11-27 時点のコードに合わせて書いています。

- 項目の状態（済み・残り）は `docs/plan.md` 10 章が正です。ここは「どう作るか」だけを書きます。
- 新しい型・関数のシグネチャは**案**です。実装するときに、まわりのコードに合わせて変えてかまいません。
- 行番号は 2026-11-27 時点のものです。ずれていたら名前で探してください。
- 終わったら `docs/plan.md` 10 章の項目にチェックを付け、日付と要点を書き足します。そのうえで、この文書の該当の節を消します。

## 0. 共通の決まり

| 決まり                 | 内容                                                                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| テスト                 | 変更ごとに `npm run typecheck`・`npx prettier --check src test docs .claude`・関係するテストのファイル（`npx ttsx --noCheck test/<…>.test.ts`）。全体（`npm test`、4〜5 分）は、保存の形・依存関係のグラフ・走査・ゴールデンを変えたときと、コミットの前の区切りに流す |
| 全体テストの最中       | ファイルを編集しない・ほかの `ttsx` を動かさない（書き込みスレッドのテスト M5 が ttsc のキャッシュのエラーで落ちる）。続けて落ちるときは `node_modules/.cache/ttsc` を消して流し直す                                                                                   |
| テストの登録           | 新しいテストのファイルは `test/run.ts` に足す（足さないと `npm test` で流れない）                                                                                                                                                                                      |
| JSON の形を変えたとき  | `src/analyzer/unit/unitType.ts` の `UNIT_FORMAT_VERSIONS`（今は apex 10・lwc 5・object 7・objectTranslation 2・metadata 8）を上げ、同じファイルの版の説明に 1 行足す                                                                                                   |
| 定義・参照を変えたとき | `src/analyzer/unit/dependencies.ts` の `DERIVED_VERSION`（今は 11）を上げる                                                                                                                                                                                            |
| ゴールデン             | 依存関係: `npx ttsx --noCheck docs/examples/analysis/scripts/baseline.ts`、保存の置き場: `…/scripts/store.ts`、`unknown` の数: `…/scripts/unknowns.ts`、Flow: `test/flows/golden`。作り直したら差分を見て、意図したものだけか確かめる                                  |
| provider を足したとき  | 下の「provider の足し方」                                                                                                                                                                                                                                              |
| 部品を足したとき       | 下の「部品の足し方」                                                                                                                                                                                                                                                   |
| 走査                   | JSON を辿るときは `processor/commons/node.ts` の `walkJson`（ノードの並びは `jsonNodesIn`）。JSON を調べる小さな関数は `processor/commons/json.ts`（`isRecord`・`recordOf`・`stringOf`・`jsonRecordsOf` など）                                                         |
| Bash での編集          | テンプレートリテラル（`` ` ``・`${…}`）を含む書き換えは、Bash のヒアドキュメントや `node -e` では壊れる。スクリプトをファイルに書くか、エディターで直す                                                                                                                |

### provider の足し方

1. 行のスキーマを `src/analyzer/report/schemas.ts` に書く。行は `...rowBaseShape`（`status?`・`filePath?`・`sourceKeys?`）を含める。比べたときに変わった列を出すなら `...changedPropertiesShape`。省略できる列は `.exactOptional()`。
2. 型を `src/analyzer/report/types.ts` に `z.infer` で足す。
3. 作る関数を `src/analyzer/report/<領域>.ts` に書く。入力は `ReportInput`（`{ before?: Repository; after: Repository }`）。種類ごとの単位を使うなら `snapshotInputOf(input)`、依存関係なら `dependencyGraphOf(input.after)`（比べるときは `input.before` も）。Apex の本体の解析は `report/apex.ts` の `analysisOf(result)`・`unitInfoOf(result)` を使う（どちらも結果ごとに覚えている）。
4. 比べるときは `report/commons.ts` の `compareKeyed`（キーで対応付けて added / removed / changed）と `rowBase(compared, keys?, filePath?)`。
5. `src/analyzer/report/registry.ts` の `PROVIDER_DEFINITIONS` に `define({ description, category, shape, args, output, example?, requiresComparison?, run })` を足す。引数は共通の部品（`names(what)`・`onlyChanged`・`traverseArgs`・`rows(schema)`）を使う。
6. `report/index.ts` から export し、`npm run catalog` でカタログ（`docs/catalog/`）を作り直す。
7. テスト: 出力がスキーマを通る、1 時点、比べるとき、絞り込みの引数（`test/processor/report-providers.test.ts` に足すか、新しいファイル）。

### 部品の足し方

1. `src/report/catalog.ts` の `REPORT_COMPONENTS` に `{ props: z.object({...}), description }`。データを受ける props は `bound('<中身>')`、省略できるものは `.nullable()`。
2. 同じファイルの `REPORT_DATA_BINDINGS` に `{ prop, shapes?, providers? }`。出力の形（`DataShape`）か provider の名前で、受け取れるデータを決める。
3. `src/viewer/report/components/<名前>.tsx` に描く関数、`src/viewer/report/registry.tsx` の `components` に登録。データを受ける部品は、自動で「比べた時点」の札が付く（`REPORT_DATA_BINDINGS` にあるもの）。
4. 画面に依存しない計算（集計・変換）は `src/report/` か `src/viewer/report/*Model.ts` に分け、node のテストで確かめる。
5. `npm run catalog`、`npm run build:report` のあと、サンプルの文書で画面を目で確かめる。

---

## A. 型の仕上げ（残り）

P1 は「IR の型の後回しの 5 件」を除いて済み。A-1（Diff の共通部品の型）・A-2（テストの手書きの JSON）も済み。

### A-3. IR の型の後回しの 5 件（P1、低）

**決まり**: 単独では進めない。C・G で LWC の該当部分を触ったら、その場で `lwc_IR` のビジターと `types/lwc` の型を対で直す（`docs/todo.md` の決定 15）。詳しい提案は `docs/ir-types.md` 5.3（642〜675 行）・5.4（805〜829 行）・6 章（868〜876 行）。IR には `any`・`unknown` の穴はなく、問題は「型が緩い」ことだけ。

| 項目                    | 今の状態                                                                                                                                                                                                                                                                                        | 直す形（案）                                                                                                                                                                      | 一緒に直す `types/lwc` の側                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 引数の rest             | `params: FunctionParameterTypeClass[]`（`lwc_IR/commons/functionDeclaration.ts:55`・`arrowFunctionExpression.ts:58`・`classMethod.ts:89` ほか）。rest がどこにでも置け、TS の `this` 引数に印がない。`RestElementFields`（`restElement.ts:54`）の `argument` に代入の左辺でしか使えない式も入る | `{ params: Param[]; rest: RestElement \| null; thisParam?: ... }`。`argument` を束縛のパターンだけに                                                                              | `types/lwc/component.ts:447-489`（引数の JSON。`rest?: true`）、`expression.ts:565-607`（`makePattern`）、`type.ts:315-355`  |
| 識別子の 3 分け         | `IdentifierFields`（`lwc_IR/commons/identifier.ts:26`）が参照でも `typeAnnotation`・`optional`・`decorators` を持つ。`objectPattern.ts`・`arrayPattern.ts`・`assignmentPattern.ts` も同じ                                                                                                       | 参照 `Identifier { name }`、束縛 `BindingIdentifier { name; annotation }`、引数 `Param { pattern; optional; decorators }`。`tSIndexSignature.ts` の型注釈を必須に                 | `component.ts:478-481`・`module.ts:249`・`statement.ts:249`（`typeAnnotation` を読むところ）                                 |
| Flow と TS の型注釈     | 型注釈のある項目ごとに Flow か TS かを別々に選ぶ（`functionDeclaration.ts:59-62` の `returnType`・`typeParameters`・`predicate` など）。クラスのプロパティだけ `ClassMemberAnnotation`（`classProperty.ts:219`）の `{ kind: 'ts' } \| { kind: 'flow' }` にした                                  | `annotations: { lang: 'ts'; ... } \| { lang: 'flow'; ... } \| null` に寄せる。呼び出し・new の `typeArguments`、クラスの TS / Flow の項目、`declare class` のデコレーターも同時に | `type.ts:162-168`（`makeLwcTypeJson` が両方をはがす）と、`type.ts`・`typeDeclaration.ts` の Flow の枝                        |
| `.js` と `.ts` のノード | IR は言語を知らない（`lwc_IR/commons/program.ts:16` は `sourceType` だけ）。言語は `parser/Lwc/module.ts` の `ScriptLanguage` にだけあり、`makeLwcModuleJson(parsed.ir, parsed.language, context)` に別の引数で渡す                                                                             | `Program` に `language: 'js' \| 'ts'`。IR の総称化は重いので、まず JSDoc と `language` の項目だけ。基底の `LwcCommonTypeClass`（`lwc_IR/commonVisitor.ts:39`）に `readonly kind`  | `types/lwc/module.ts`（`language` の引数をやめて IR から読む）                                                               |
| タプルの型              | `tSTupleType.ts:239-267` で named / unnamed は分けた。残り: 省略できる要素が必須の要素の前に置ける、rest が 2 つ以上置ける、`TSOptionalType`・`TSRestType`・`TSNamedTupleMember`・`TSTypePredicate` が一般の `TSTypeTypeClass` に入っている                                                     | `TSTupleElementTypeClass`・`TSReturnTypeTypeClass` に分け、`create` で並びを検査（`failIrBuild`）                                                                                 | `type.ts:572-595`（タプルを `{ type: 'tuple', elementTypes }` に）・`type.ts:411-419`（rest の中の名前つきの要素が `other`） |

**手順（1 件ずつ）**

1. IR の型を直し、ビジター（`lwc_IR/**/…Visitor`）の `create` を合わせる。並びの検査は `failIrBuild` で（読めないファイルにはせず、IR の組み立ての誤りとして落とす）。
2. `types/lwc` の読む側を直す。JSON の形が変わるなら LWC の `UNIT_FORMAT_VERSIONS` を上げる。
3. `npx ttsx --noCheck test/converter/*.test.ts` と LWC のサンプルの JSON の差分（`docs/examples/analysis/scripts/store.ts`）で、意図しない変化がないことを確かめる。

**終わりの条件**: 5 件それぞれ、IR の型・ビジター・`types/lwc` が対で直り、`docs/ir-types.md` 6 章の行を消す（文書の整理 G-10 で `docs/plan.md` に移すまで）。

---

## B. 使う人に効く機能

解析と独立。B-1（表の並べ替えと列の出し分け）・B-2（report notes・list_note_keys）・B-3（CSV の書き出し）は済み。残りを、高 → 中の順に B-4〜B-11 に分けた。手が空いたときに上から進める。

### B-4. `sourceRunner` の結果の使い回し（高）

**直すファイル**: `src/builder/reportBuilder.ts`

**今の状態**

- `sourceRunner(input, options, issues)`（136 行）は、データの宣言の全体（`JSON.stringify(source)`。provider・args・withSource・diff・compare・where）をキーに `Map` で覚える。失敗も `undefined` で覚え、問題は 1 回だけ出す。
- `runSource`（164 行）の中で、provider を動かす → `where` があれば `filterRows(all, source.where)`（155 行。export していない）→ `withSource` なら `attachSources` → `compactEmbeddedData`。
- そのため、`for` の中で `where` だけ違う宣言（行ごとのページの典型）は、行の数だけ provider を動かす。`args` のキーの順が違うだけでも別のキーになる。

**手順**

1. キーを 2 段にする。
    - 1 段目（provider の結果）: `providerKey = canonicalJson({ provider, args, comparison })`。`comparison` は `comparisonOfSource(source)`（`report/document.ts`）。`canonicalJson` はキーを並べ替えて文字列にする（`src/builder/values.ts` に足す）。
    - 2 段目（宣言の結果）: 今のキー（宣言の全体）を `canonicalJson` に替える。
2. `runSource` を「provider の結果を得る（1 段目を引く）」と「`where`・`withSource`・`compactEmbeddedData` を当てる」に分ける。
3. `where` で `filePath` を絞るとき、`compactEmbeddedData` の前の絶対パスと比べている（相対パスでは当たらない）。2 で順を変えないよう、今の順（絞る → 添える → 縮める）を保つ。順は変えず、テストで固定する。
4. ビルドの進み具合を出すとき（B-9）のために、1 段目に当たった数・外れた数を数えておく（`ResolveReportOptions` のフックに渡せる形）。

**新しい型・関数（案）**

```ts
// src/builder/values.ts
/** キーを並べ替えた JSON の文字列 (同じ値なら同じ文字列) */
export const canonicalJson = (value: unknown): string;

// src/builder/reportBuilder.ts (中だけ)
type ProviderCache = Map<string, { value: unknown; compared?: string } | undefined>;
```

**テスト**: `test/builder/source-runner.test.ts`（新規）。`where` だけ違う 3 つの宣言で provider が 1 回だけ動く（provider の呼び出しを数える。`REPORT_PROVIDERS` を差し替えられないなら、`ResolveReportOptions` に数えるフックを足す）、`args` のキーの順が違っても同じ結果、失敗の問題が 1 回だけ。

**終わりの条件**: 行ごとのページの雛形（`apex_specification`）で、ビルドの時間が目に見えて減る（サンプルと NPSP で測り、`docs/plan.md` 12 章に書く）。

### B-5. MCP の `list_report_templates` と利用者の雛形（高）

**今の状態**

- 雛形の一覧は `src/report/templateList.ts` の `REPORT_TEMPLATES`（15 個。`TemplateEntry = { description; document: () => ReportDocument }`）。使うのは CLI の `templates`・`new`（`src/cli/index.ts` 175・187 行）だけ。
- MCP のプロンプト（`src/mcp/prompts.ts`）は `REPORT_TEMPLATES` を使わず、雛形の関数を直接 import している。`SERVER_INSTRUCTIONS`（`src/mcp/context.ts:93`）にも雛形の名前を手で書いている。
- 利用者の雛形を読む仕組みはない。`docs/catalog/templates/*.json` は組み込みの雛形を `npm run catalog` で書き出したもの。

**直すファイル**: 新規 `src/report/userTemplates.ts`、`src/mcp/reportTools.ts`、`src/mcp/prompts.ts`・`context.ts`、`src/cli/index.ts`、`src/mcp/catalogResources.ts`

**手順**

1. 利用者の雛形の置き場（2026-11-27 決定）: `<保存先>/templates/*.json`（保存先は `savingRoot`。既定は `.sf-metascope`）。B-6 の設定ファイルができたら `templates` の項目で上書きできるようにする。
2. `userTemplates.ts`: フォルダの `*.json` を読み、`expandShorthand` → `ReportDocument` の zod で検査する。誤りのあるファイルは一覧に出さずに問題として返す。名前はファイル名（拡張子なし）。組み込みと同じ名前なら利用者の方を優先し、`overrides: true` を付ける。
3. `reportTools.ts` に `list_report_templates`（`list_report_providers`（126 行）と同じ形）。返すのは `{ name, description, source: 'builtin' | 'user', overrides? }[]`。引数 `name` を渡したら、その雛形の文書の JSON（`get_report_template` を別にするより 1 つにまとめる）。
4. CLI の `templates`・`new` とプロンプトを、組み込み＋利用者の一覧（`templatesOf(savingRoot)`）に替える。`SERVER_INSTRUCTIONS` の手書きの名前は `REPORT_TEMPLATES` から作る。
5. MCP の資料に `metascope://templates`（一覧）と `metascope://templates/{name}`（文書）を足す（`catalogResources.ts`）。

**新しい型・関数（案）**

```ts
// src/report/userTemplates.ts
export type TemplateSummary = { name: string; description: string; source: 'builtin' | 'user'; overrides?: true };
export type LoadedTemplates = { templates: Map<string, TemplateEntry & { source: 'builtin' | 'user' }>; issues: ReportIssue[] };
export const loadTemplates = (savingRoot: string): Promise<LoadedTemplates>;
```

利用者の雛形の `description` は、文書の `title` か、文書に足す任意の項目 `description`（`ReportDocument` に足すなら JSON Schema も作り直す）から取る。

**テスト**: `test/mcp/report-tools.test.ts`（一覧・名前を渡したときの文書・利用者の雛形・誤りのある雛形）、`test/cli/cli.test.ts`（`templates` に利用者の雛形が出る、`new` で利用者の雛形から作れる）。

### B-6. 設定ファイル `sf-metascope.config.json` と `config show`（高）

**今の状態**

- MCP: `resolveServerConfig(env, cwd)`（`src/mcp/context.ts:42`）が環境変数 `SF_METASCOPE_REPOSITORY`・`SF_METASCOPE_BASE_DIR`・`SF_METASCOPE_THREADS` から `ServerConfig = { repositoryRoot; savingRoot; threads? }` を作る。テストは `test/mcp/server-config.test.ts`。
- CLI: `runCli`（`src/cli/index.ts:137`）は `parseArgs` で `repo`・`out`・`diff`・`missing`・`compare`・`param`・`args` を読み、`--repo` は環境変数に重ねて渡す（163 行）。最初の語が `report` 以外だと使い方の誤り（157 行）。
- 設定のファイルを読む処理はない。`src/config.ts` もない。

**設定の項目（案）**: 今ある値と、これから足すものをまとめる。

| 項目                  | 今の決め方                                                       | 既定                   |
| --------------------- | ---------------------------------------------------------------- | ---------------------- |
| `baseDir`             | `SF_METASCOPE_BASE_DIR`                                          | `.sf-metascope`        |
| `threads`             | `SF_METASCOPE_THREADS`                                           | 最大 8（ビルド版だけ） |
| `reportDirectory`     | MCP の `ReportToolOptions.reportDirectory`（今は渡す手段がない） | `<baseDir>/reports`    |
| `exportDirectory`     | CLI の `export` の既定                                           | `<baseDir>/exports`    |
| `templates`           | B-5                                                              | `<baseDir>/templates`  |
| `report.warningBytes` | `ResolveReportOptions.warningBytes`                              | 8 MB                   |
| `report.forLimit`     | `DEFAULT_FOR_LIMIT`（`src/builder/expand.ts:35`）                | 200                    |
| `report.params`       | CLI の `--param`                                                 | なし                   |

**手順**

1. `src/config.ts`: リポジトリのルートの `sf-metascope.config.json` を読み、zod（`ConfigSchema`。知らないキーは誤り）で検査する。ない場合は空。JSON Schema を `docs/catalog/` に書き出す（`npm run catalog`）。
2. 優先の順: CLI の引数 > 環境変数 > 設定ファイル > 既定。`resolveServerConfig` を `resolveConfig({ env, cwd, flags })` に広げ、`ServerConfig` を `ResolvedConfig`（上の表の項目と、それぞれの出どころ `sources: Record<key, 'flag' | 'env' | 'file' | 'default'>`）にする。
3. MCP の `createServer` に `reportDirectory` などを渡す（今は既定しか使えない）。CLI の `export`・`build` の既定を設定から取る。
4. CLI に `config` の群を足す（157 行の判定を直す）。`config show` は解決した値と出どころを JSON で出す。`config init` で雛形のファイルを書く（任意）。
5. MCP のサーバーの版（`src/mcp/server.ts:23` の `'0.1.0'`）を `package.json` の版から取る（ついでに直す）。

**新しい型・関数（案）**

```ts
// src/config.ts
export const CONFIG_FILE = 'sf-metascope.config.json';
export const ConfigSchema = z.strictObject({ baseDir: z.string().exactOptional(), threads: z.number().int().min(0).exactOptional(), ... });
export type ResolvedConfig = { repositoryRoot: string; savingRoot: string; threads?: number; reportDirectory: string; exportDirectory: string; templatesDirectory: string; report: { warningBytes: number; forLimit: number; params: Record<string, string> }; sources: Record<string, 'flag' | 'env' | 'file' | 'default'> };
export const resolveConfig = (options: { env?: NodeJS.ProcessEnv; cwd?: string; flags?: Partial<...> }): Promise<ResolvedConfig>;
```

**テスト**: `test/config.test.ts`（新規。優先の順・知らないキー・ない場合）、`test/mcp/server-config.test.ts` を `resolveConfig` に合わせる、`test/cli/cli.test.ts` に `config show`。

### B-7. 配布の形（npm の公開）（高）

**今の状態（`package.json`）**: `name: sf-metascope-analyzer`・`version: 1.0.0`・`main: dist/index.js`・`type: module`・`bin: { "sf-metascope": "bin/sf-metascope.mjs" }`（`dist/node/cli/index.js` を読む）・`license: ISC`・`author: ""`。`files`・`exports`・`types`・`repository`・`prepublishOnly` がない。`LICENSE` もない。React などの viewer にしか使わないものが `dependencies` にある（viewer は 1 つの HTML にビルド済み）。CI（`.github/workflows/ci.yml`）に公開・パッケージの確認の手順はない。

**手順**

1. `files`: `bin/`・`dist/node/`・`dist/viewer/report/index.html`・`dist/**/*.d.ts`（型を配るなら）・`docs/catalog/`（文書の JSON Schema と雛形。CLI の `documentSchemaPath()`（`src/cli/index.ts:125`）が上の階層を探すので、パッケージの中の位置で見つかるか確かめる）・`README.md`・`LICENSE`。
2. `exports`: `"."`（ライブラリの入口 `dist/node/index.js` と型）、`"./package.json"`。`main` と `types` も合わせる。
3. `dependencies` の整理: viewer だけで使うもの（react・react-dom・@xyflow/react・@json-render/*・lucide-react・react-markdown など）を `devDependencies` に移す。移したあと `npm pack` → 別のフォルダに入れて `sf-metascope report templates` と MCP の起動が動くこと。
4. `LICENSE` を足し、`license` を合わせる（公開するか・どのライセンスにするかは、まだ決めていない。`docs/plan.md` 9 章「まだ決めていないこと」）。`repository`・`author`・`keywords`・`engines`（今は `>=24.15`）を整える。
5. `prepublishOnly: npm run build`。
6. CI に「`npm pack` → 一時フォルダに入れる → CLI のヘルプと `report templates` を動かす」手順を足す（ubuntu だけでよい）。

**終わりの条件**: `npm pack` の成果物を入れたフォルダで、CLI と MCP が動く。CI で毎回確かめる。

### B-8. `report export` の残り（Excel・Markdown・Word）（中）

**今の状態**: `src/cli/index.ts` の `writeDataCsvs(state, directory)`（79 行）が、`state.data` のうち行の並びのものを `tableToCsv(rows, tableColumnsOf(rows))`（`src/report/tableData.ts`）で CSV に書く。ページに分けた文書のページのデータ（`resolved.pages[].report.spec.state`）は書いていない。行列（`{ rows }` のオブジェクト）・図は飛ばしている。

**手順**

1. 先に直す: ページのデータも書く（ページのファイル名のフォルダに分ける）。行列は「行 × 列」の表に直して書く（`matrixToRows`。G-8 の `Matrix` の一般化と同じ形を使う）。
2. 書き出しの処理を CLI から `src/builder/export/` に移す: `export/csv.ts`（今の処理）、`export/markdown.ts`、`export/xlsx.ts`（必要になったら）。CLI の `export` に `--format csv|md`（既定 csv。xlsx は必要になったら）。
3. Markdown: 文書の要素（`spec.elements`）を根から辿り、`Heading` → `#`、`Narrative`・`Text` → そのまま、`DataTable` → 表（`$state` の参照は `src/report/embedding.ts` の `stateRefOf` で引き、列は DataTable の props の `columns` があればそれ、なければ `tableColumnsOf`）、`PageLink` → リンク、図 → 「（図は HTML で見てください）」。表は `tableToMarkdown(rows, columns)`（`tableData.ts` に足す。`cellText` を使い、`|` と改行をエスケープ）。
4. Excel: 当面は作らない（2026-11-27 決定。CSV は BOM つきで Excel で開ける）。必要になったら `exceljs` を入れ、データの名前ごとにシートを 1 つ（シート名は 31 文字・使えない文字を置き換え）、列の見出しは `Column.label`。
5. Word: 作らない（2026-11-27 決定）。Markdown の書き出しだけにし、Word へはほかの道具で変える。

**新しい型・関数（案）**

```ts
// src/builder/export/index.ts
export type ExportFormat = 'csv' | 'md'; // xlsx は必要になったら
export const exportReport = (resolved: ResolvedReport, directory: string, format: ExportFormat): Promise<string[]>; // 書いたファイル
// src/report/tableData.ts
export const tableToMarkdown = (rows: readonly Row[], columns: readonly Column[]): string;
// src/builder/export/markdown.ts
export const reportToMarkdown = (spec: ReportSpec, state: Record<string, unknown>): string;
```

**テスト**: `test/builder/export.test.ts`（新規。ページのデータ・行列・Markdown の表のエスケープ・要素の順）、`test/cli/cli.test.ts`（`--format md`）。

### B-9. CLI の引数・`report watch`・進み具合（中・低）

| 項目                  | 手順                                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--threads`           | `--repo` と同じく、環境変数 `SF_METASCOPE_THREADS` に重ねて渡す（B-6 のあとは `flags` で渡す）                                                                                                                                                                                                          |
| `--quiet`             | 標準エラーの「リポジトリを読み込んでいます…」（166 行）・警告（300 行）・「雛形を書きました」（214 行）を出さない。`CliIo` に `quiet` を持たせ、出すところを 1 つの関数（`info(io, message)`）にまとめる                                                                                                |
| `--json`              | `templates`・`providers`（今は文字の一覧）も JSON で出す。警告も `{ warnings: ReportIssue[] }` として結果に含める                                                                                                                                                                                       |
| `report watch <文書>` | 新規 `src/cli/reportWatch.ts`。`fs.watch` で文書のファイルとリポジトリ（`force-app` など。B-6 の設定で範囲を決める）を見て、変わったら作り直す（`build` の処理（263〜339 行）を関数に切り出して使う）。リポジトリが変わったら `processor.reset()`。連続の変化は 300 ms まとめる。プロセッサーは閉じない |
| ビルドの進み具合      | `ResolveReportOptions` に `onProgress?: (event: { phase: 'data' \| 'expand' \| 'pages' \| 'write'; done: number; total?: number }) => void`。CLI は標準エラーに、MCP は進捗の通知（`notifications/progress`）に出す。NPSP の Apex の仕様書で時間を測る                                                  |

**テスト**: `test/cli/cli.test.ts` に `--quiet`・`--json`。`watch` は、ファイルを書き換えて 1 回作り直されることを確かめる（時間がかかるなら手で）。

### B-10. 文書の書き方の拡張（中）

文書の形は `src/report/document.ts`（`ReportDataSource`・`ReportCondition`・`ReportFor`・`ReportDocument`）、展開は `src/builder/expand.ts`（`expandReportDocument`・`rowsOf`・`test`・`fill`）。形を変えたら `npm run catalog` で JSON Schema（`documentSchema.ts`）を作り直す。

| 項目                      | 今の状態                                                                                     | 手順                                                                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| where の比べ方            | `filterRows` は等しいか（配列ならどれかに等しい）だけ                                        | where の値に条件のオブジェクトも書けるようにする: `{ "name": { "startsWith": "Account" }, "complexity": { "gte": 10 }, "status": { "not": "unchanged" } }`。演算子は `ReportCondition` の比べ方（`eq`・`neq`・`gt`・`gte`・`lt`・`lte`・`in`・`exists`）に `contains`・`startsWith` を足して共通にする |
| 行の中の配列を for で回す | `for.in` は名前か宣言だけ                                                                    | `"in": "${m.items}"`（変数の中の配列）を許す。`rowsOf`（190 行）で `fill` のあとに配列なら使う                                                                                                                                                                                                         |
| for の並べ替え            | なし                                                                                         | `ReportFor` に `sort?: string \| { key: string; order: 'asc' \| 'desc' }`。`src/report/tableData.ts` の `compareCells` を使う                                                                                                                                                                          |
| `${` のエスケープ         | なし                                                                                         | `$${` を `${` のまま残す（`fill`（65 行））                                                                                                                                                                                                                                                            |
| 文書の形の版              | `version` がない                                                                             | `ReportDocument` に `version?: 1`。ない場合は 1。JSON Schema に `$id` と版                                                                                                                                                                                                                             |
| YAML                      | CLI は `JSON.parse` だけ（256 行）                                                           | 急がない（2026-11-27 決定）。要望があれば `src/report/readDocument.ts`（`.json`・`.yaml`・`.yml`）と `yaml` のライブラリで対応する                                                                                                                                                                     |
| 部分の使い回し            | なし                                                                                         | `spec.parts: Record<string, Element>` と要素の `use: "<部分>"`・`with: { 変数 }`。展開のときに差し込み、循環を検出する                                                                                                                                                                                 |
| ページのファイル名        | `fileNameOf`（`src/builder/pages.ts:43`）。大文字・小文字だけ違う名前が Windows で重なる     | 重なりの検出を大文字・小文字を区別せずに行い、`_2` を付ける。種類が違う同じ名前（クラスとトリガー）は `page.file` に種類を入れる雛形にする                                                                                                                                                             |
| ページの入れ子            | 入れ子のページは分けない（警告）                                                             | `SplitPage` に `parent?: string`（親のページの file）。親のページの中の `PageLink` は `<親>/<子>.html`                                                                                                                                                                                                 |
| 問題のメッセージ          | 英語の文字列を `expand.ts`・`reportBuilder.ts` に直に書き、`ReportIssue = { path; message }` | `src/report/diagnostics.ts` に `{ code; severity; message: { ja; en }; hint? }` の表を作り、出すところをコードで引く形にする。`ReportIssue` に `code`・`severity`。言語は設定（B-6）で選ぶ                                                                                                             |

**テスト**: `test/builder/expand.test.ts`（where の演算子・for の並べ替え・配列の for・エスケープ・部分）、`test/builder/pages.test.ts`（大文字・小文字の重なり）。

### B-11. viewer のリンクと見せ方（中）

**今の状態**: `PageLink`（`src/report/catalog.ts:67`）は `href`（`pages/<file>.html`）をそのまま `<a>` にする（`src/viewer/report/registry.tsx:87`）。戻りのリンクは `report.parent.href`（`'../index.html'`）。ページの間のリンク（クラスのページから別のクラスのページ）を作る仕組みはない。MCP Apps の画面では相対のリンクが開けない（`src/viewer/report/main.tsx:45` で埋め込みかを見分けている）。

**手順**

1. `src/viewer/report/links.ts`（新規）: `pageHref(from: 'index' | 'page', file: string)`（index からは `pages/x.html`、ページからは `x.html`）と、単位のページの表（ビルドのときに `pages` の一覧から `{ unitType, name } → file` を作り、`report` に埋め込む `pageIndex`）。
2. `DataTable` の名前の列・`GraphView`（G-3）のノードを押したとき、`pageIndex` にあればそのページへ。
3. ファイルの列（`filePath`）から VS Code（`vscode://file/<絶対パス>:<行>`）・GitHub（設定 B-6 の `repositoryUrl` があれば）を開く。
4. MCP Apps の画面: ページを開く代わりに、ツール `build_report` の結果の `pages` から選んで描き直す（`_meta` の受け渡しを見直す）。
5. そのほか（10 章「部品と viewer」）: ページの中の目次（`Heading` を集める）、文書の中の検索、API 名とラベルの切り替え（表の列の表示を切り替える viewer の状態）、status のない「変化」の列を出さない（`AutomationView`・`LayoutView`・`FlexiPageView`）、印刷用の CSS。

**テスト**: `test/viewer/links.test.ts`（新規。`pageHref` と `pageIndex`）。画面は `npm run build:report` で目で確かめる。

---

## C. 値の解析（P4 段 2 の本体）

C-1〜C-7（CFG・到達定義・定数の伝播・文字列の組み立て・動的クエリの復元・ループの中の操作・CRUD/FLS）は済み。残りは「C の終わりに」の確かめだけ。作ったものは下の表のとおりで、D・G・H が使う。

### 入力（今あるもの）

| 入力                               | 場所                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 単位の解析                       | `semantic/analyze.ts` の `analyzeApexUnit(unit, options?)` → `ApexSemanticAnalysis`（`declarations`・`bodies: ApexBodySemantics[]`）。provider からは `report/apex.ts` の `analysisOf(result)`（リポジトリの索引なし・単位の中だけ）                                          |
| 実行本体（文の並び・引数・持ち主） | `semantic/declaration.ts` の `ApexExecutableBody`                                                                                                                                                                                                                             |
| 変数の宣言・読み書き・定義         | `semantic/statement.ts` の `ApexBodyAnalysis`・`ApexVariableAccess`・`ApexDefinition`                                                                                                                                                                                         |
| 呼び出し・型                       | `semantic/call.ts`（`ApexExpressionRef`）・`semantic/type.ts`                                                                                                                                                                                                                 |
| クエリ・DML・事実                  | `semantic/query.ts`・`semantic/facts.ts`（`apexUnitFactsOf(analysis)` → `ApexUnitFacts`。`ApexQueryFact` に `restoration?`・`fields?`・`accessMode?`）。provider からは `unitInfoOf(result)`                                                                                  |
| CFG                                | `semantic/cfg.ts` の `apexCfgOf(body)`（`ApexCfg`: 評価点・辺（normal・true・false・loopBack・exception・return・break・continue・case）・`successors` / `predecessors`）と `reachableApexCfgNodes(cfg)`                                                                      |
| 値の解析                           | `semantic/dataflow.ts` の `apexDataflowOf(semantics, cfg?)`: `reachingDefinitions(access)`・`valueOf(access)`（`ApexValue` = 定数か理由つきの unknown）・`valueOfDefinition`・`segmentsOf(expr)`（`ApexStringSegment` = 文字か穴）・`nodeOf(sourceKey)`                       |
| 動的クエリ                         | `semantic/dynamicQuery.ts` の `apexDynamicQueriesOf(semantics)` → `ApexDynamicQuery`（`language`・`restoration`: complete / partial / none・`text`・`objects`・`fields`）                                                                                                     |
| ループの中の操作                   | `semantic/loopOperations.ts` の `apexLoopOperationsOf(analysis, facts)` → `ApexLoopOperation`（`member`・`kind`: soql / sosl / dynamicQuery / dml・`via`: direct / call・`path?`・`operation?`・`isTest`）。単位の中だけ、呼び出し先が 1 つに決まるものだけ、届かない文は除く |
| 守り方                             | `semantic/security.ts` の `apexSecurityChecksOf(analysis, facts)` → `ApexSecurityCheck`（`kind`: query / dml・`detail`・`enforcement`: userMode / securityEnforced / systemMode / stripInaccessible / none・`sharing`・`owner?`・`isTest`）                                   |

### C の終わりに（LWC に当てはまるかの確かめ）

P2 の「ソースの位置、宣言と参照の ID、CFG の辺、到達定義、`unknown` の理由が、LWC でも使えるか」を確かめ、結果を `docs/plan.md` 10 章の P2 の項目に書く。作るのではなく、作るときの穴を書き出すのが目的。

**今の LWC の解析**: `processor/Lwc/calls.ts` の `analyzeLwcModuleCalls(module)`（714 行）が本体（メンバー・ほかのクラスのメンバー・最上位の関数・最上位の文）ごとに `LwcContentCalls`（呼び出し・イベント）を返す。中は `walkLwcJson` の 1 回の走査で、制御の流れはない。呼び出しごとに `context: { functionDepth, loopDepth, nestingDepth, inTry }`（`processor/Lwc/walker.ts:64`）を持つだけ。`then` などのコールバックの中は外の本体に混ぜている。Promise は `promiseUsesIn`（324 行）が `awaited`・`then`・`catch`・`finally`・`returned` を構文で記録するだけ。

**確かめること（Apex の `cfg.ts` と比べて）**

| 観点         | Apex と同じに作れる                                                                                                                                                                  | LWC で新しく要る                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本体         | —                                                                                                                                                                                    | `ApexExecutableBody` にあたる型（`id`・文の並び）。`LwcBodyContentJson`（`block`、式だけのアロー関数は `expression`）と `module.statements` に安定した `bodyId`                                                                                                                 |
| 文           | `jsIf`（`conditionBlock`）・`jsWhile`・`jsDoWhile`・`jsBlock`・`jsFor`（`update` は 1 つの式）・`jsForIn` / `jsForOf`・`jsReturn`・`jsThrow`・`jsTry`（catch は 1 つ、型の照合なし） | `jsSwitch` の fall-through（Apex の `when` とは違う）、ラベルつきの `break` / `continue` と `jsLabeled`（ループの積み重ねでなくラベルの積み重ね）、switch を抜ける `break`。そのほかの文（`jsEmpty`・`jsDebugger`・`jsWith`・関数・クラスの宣言）は既定の扱い                   |
| 式の中の分岐 | `jsConditional`、`&&`・`\|\|`                                                                                                                                                        | `??`、`?.`（`jsMemberAccess.operator`・`optionalCall`）、`??=`・`\|\|=`・`&&=`                                                                                                                                                                                                  |
| 子の式の並び | Apex は `childNodesOf`                                                                                                                                                               | `LwcNodeJson` の子を並べる関数（`lwcType` と、入れ子の関数の本体は飛ばす）                                                                                                                                                                                                      |
| 非同期       | —                                                                                                                                                                                    | `await`・`yield` を中断の点にするか。`then` / `catch` のコールバックは別の本体の CFG にし、「呼び出し → then の入口」「失敗 → catch の入口」の本体をまたぐ辺でつなぐ。`try` が `await` を囲むと失敗を受けるが、`x().then()` を囲んでも受けない（今の `inTry` では区別できない） |
| 例外         | Apex と同じ近似（try の中の文だけが投げる）                                                                                                                                          | —                                                                                                                                                                                                                                                                               |
| 値の解析     | 到達定義の考え方はそのまま                                                                                                                                                           | 変数の宣言の種類（`const`・`let`・`var` の巻き上げ）、クロージャーが外の変数を書き換える                                                                                                                                                                                        |

**手順**: 上の表をサンプルの LWC（`docs/examples/repository/after` の LWC）の `if`・`try`・`async` / `await`・`then` を含むメソッドで確かめ、使えない所を `docs/plan.md` 10 章 P2 の「LWC でも使えるか」の項目に書き足してチェックを付ける。LWC の CFG（`processor/Lwc/semantic/cfg.ts` の `lwcCfgOf`）を作るかは、`lwc.callGraph`（G-5）・LWC の指摘（D）で要るかを見てから決める。

---

## D. 指摘の provider（`apex.findings`・`lwc.findings`）

**決めたこと（2026-11-27。`docs/plan.md` 9 章）**

- ルールの選別: メタデータとまたがるルールと、この解析でしか分からないルール（下の D-2）に絞る。一般のコードの品質のルールは PMD に任せる。
- 有効・無効の切り替えの場所: 両方。設定ファイル（B-6）でプロジェクトの既定、provider の引数 `rules` で文書ごとに上書き。設定ファイルができるまでは引数だけで作る。
- findings を SQLite に保存するか: 今は保存しない（毎回作る）。E-1 の計測で遅ければ E-3 と一緒に `finding` 表を足す。

**今の状態**

- Apex の単位の中で決まる指摘は `semantic/rules.ts` の `apexRuleFindingsOf(analysis, facts)`（`SEE_ALL_DATA`・`TEST_VISIBLE_NOT_NEEDED`・`FUTURE_CALLOUT_NOT_ALLOWED`・`QUERY_SECURITY_ENFORCED`）。
- それを `metadata.findings`（`report/crossRef.ts` の `findingsOf(repository)`（145 行。export していない）→ `getMetadataFindings(input)`（247 行））の source `apex` として出している。比べるときのキーは `source:code:unit:target`。
- 行の形は `FindingRowSchema`（`report/schemas.ts:359`）: `{ ...rowBaseShape, source: 'permission' | 'label' | 'flow' | 'layout' | 'flexiPage' | 'reference' | 'repository' | 'apex', code, severity: 'error' | 'warning' | 'info', unit, target, message }`。
- LWC の指摘は `processor/Lwc/analysis.ts`（`UNKNOWN_SLDS_ICON` など）。参照の指摘はグラフの `referenceFindingsOf(graph)`（`processor/dependency/graph.ts:640`。`APEX_METHOD_NOT_AURA_ENABLED`・`APEX_METHOD_NOT_CACHEABLE` は `lightningApexFindingOf`（610 行）が辺の `via` が `import` / `wire` のものから作る）。

**新しいファイル**: `src/analyzer/report/apexFindings.ts`・`lwcFindings.ts`、`test/processor/apex-findings.test.ts`・`lwc-findings.test.ts`

**直すファイル**: `semantic/rules.ts`（ルールの表）、`report/schemas.ts`（`FindingRowSchema` に列を足す）、`report/crossRef.ts`（source `apex` を外す）、`report/registry.ts`

### D-1. ルールの表

```ts
// semantic/rules.ts
export type ApexRuleSeverity = 'error' | 'warning' | 'info';
export type ApexRule = {
    code: string;
    severity: ApexRuleSeverity;
    /** 既定で有効か */
    enabled: boolean;
    /** 分類 (表の絞り込み・Chart のまとまり) */
    category: 'security' | 'performance' | 'test' | 'design' | 'reliability';
    description: string;
    check: (context: ApexRuleContext) => ApexRuleFinding[];
};
export type ApexRuleContext = {
    analysis: ApexSemanticAnalysis;
    facts: ApexUnitFacts;
    /** 本体ごとの値の解析 (必要なルールだけが呼ぶ。覚えておく) */
    dataflowOf: (body: ApexBodySemantics) => ApexDataflow;
    /** メタデータとまたがるルール (ない場合は飛ばす) */
    graph?: DependencyGraph;
};
export type ApexRuleFinding = {
    code: string;
    member?: string;
    target: string;
    message: string;
    sourceKeys?: ConvertKeys;
    /** 根拠 (ループの中の呼び出しの並びなど。FindingsList で見せる) */
    evidence?: { path?: string[]; detail?: string };
};
export const APEX_RULES: readonly ApexRule[];
export const apexRuleFindingsOf: (
    context: ApexRuleContext,
    codes?: readonly string[],
) => ApexRuleFinding[];
```

### D-2. ルール（案。9 章の選別で増減する）

| code                                | 分類        | 重さ    | 根拠の解析                                                                                     | 既定 |
| ----------------------------------- | ----------- | ------- | ---------------------------------------------------------------------------------------------- | ---- |
| `SEE_ALL_DATA`                      | test        | warning | 今の `rules.ts`                                                                                | 有効 |
| `TEST_VISIBLE_NOT_NEEDED`           | test        | info    | 今の `rules.ts`                                                                                | 有効 |
| `FUTURE_CALLOUT_NOT_ALLOWED`        | reliability | error   | 今の `rules.ts`                                                                                | 有効 |
| `QUERY_SECURITY_ENFORCED`           | security    | info    | 今の `rules.ts`                                                                                | 有効 |
| `SOQL_IN_LOOP`                      | performance | warning | `apexLoopOperationsOf` の `kind: soql \| sosl \| dynamicQuery`。`via: call` は `path` を根拠に | 有効 |
| `DML_IN_LOOP`                       | performance | warning | 同じく `kind: dml`                                                                             | 有効 |
| `QUERY_WITHOUT_ACCESS_CHECK`        | security    | warning | `apexSecurityChecksOf` の `kind: query`・`enforcement: none`（テストを除く）                   | 有効 |
| `DML_WITHOUT_ACCESS_CHECK`          | security    | warning | 同じく `kind: dml`                                                                             | 有効 |
| `CLASS_WITHOUT_SHARING_DECLARATION` | security    | info    | `sharing` がない（内部クラスは外のクラスに従うので除く）、DML・クエリを持つ                    | 有効 |
| `DYNAMIC_QUERY_UNRESOLVED`          | security    | info    | `apexDynamicQueriesOf` の `restoration: none`（文字列の由来が分からない。テイント解析の前段）  | 無効 |
| `UNREACHABLE_CODE`                  | design      | info    | `reachableApexCfgNodes` に入らない文（H-3 の provider と同じ計算）                             | 有効 |
| `HARDCODED_ID`                      | reliability | warning | 文字列の定数が 15 / 18 桁の Id の形（`dataflow` の定数も含める）                               | 有効 |

### D-3. provider

1. `apex.findings`。引数 `{ classes?, rules?: string[], categories?, severity?, includeTests? }`。行は `FindingRowSchema` に列を足した形（下）。比べるときは `compareKeyed`（キーは `code:unit:member:target`。行番号はキーに入れない（行がずれただけで added / removed にしない））。
2. `FindingRowSchema` に足す列: `rule?: { category; description }`・`member?`・`line?`（`sourceKeys` から `report/apexFlow.ts` の `sourceTextsOf(result)` で行番号）・`evidence?`。source の enum に `lwc` を足す。
3. `lwc.findings`: LWC の解析の指摘（`processor/Lwc/analysis.ts`）と、グラフの LWC の指摘（`referenceFindingsOf` のうち、`from` が `lwc:` のもの）をまとめる。引数 `{ components?, rules?, severity? }`。
4. `metadata.findings` の source `apex` は、`apex.findings` ができたら外す（重ねて出さない）。`metadata.findings` の説明に「Apex は `apex.findings`、LWC は `lwc.findings`」と書く。
5. 有効・無効（2026-11-27 決定: 両方）: 引数 `rules` を渡したらそれだけ、渡さなければ `enabled: true` のもの。設定ファイル（B-6）ができたら、`findings.rules` で既定を上書きする（引数が優先）。

**テスト**: `test/processor/apex-findings.test.ts`。ルールごとに 1 つ以上（引っかかる例と引っかからない例。`with sharing` の内部クラス、テストクラスの中の SOQL など）。`rules`・`severity` で絞る、比べるときの status（行がずれただけでは unchanged）。`test/processor/lwc-findings.test.ts` も同じ。

**終わりの条件**: `apex.findings`・`lwc.findings` がカタログに出て、`metadata.findings` と重ならない。`security_overview`・`code_quality_overview`（G-9）の雛形から使える。

---

## E. 計測と SQLite（P0 → P3）

**前提**: NPSP のリポジトリの取得（`git clone`。こちらの環境で行う）。

### E-1. 基準を取る（P0）

**ファイル**: `docs/examples/analysis/scripts/measure.ts`（`--runs`・`--threads` がある）

**手順**

1. NPSP を取得し、`npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts <NPSP のルート> <NPSP のルート> --runs 3 --threads 8` で測る。ビルド版でも測る（`npm run build` のあと `node dist/node/...`）。
2. 次の値の中央値を `docs/plan.md` 12.2 に書く。
    - 最初の読み込み・起動し直した読み込みの時間
    - メモリの最大
    - DB の大きさ・node 表の行の数
    - `crossRef.labels`・`get_dependents` の 1 回目の時間
3. 9 章の「遅延読み込みの範囲」「`derived` の BLOB を残すか」を、数字を見て決める。

### E-2. `Repository` の遅延読み込み（P3、高）

**直すファイル**: `src/analyzer/unit/repository.ts`（`Repository`）・`store.ts`（`UnitStore`）・`storeSqlite.ts`

**今の状態**: `Repository` は `units: Map<string, UnitParseResult[]>` に全単位の木を持つ。`get(type)`・`entries()` は同期で配列を返し、provider・グラフ・レポートのほとんどがこれを使う。

**手順（案）**

1. 目録（id・種類・場所・key）だけを持つ `RepositoryIndex` を作る。木は `UnitStore.readParsed` で必要なときに読み、LRU で手放す。
2. 同期の `get(type)` を残すため、段階で移す。
    1. `Repository` に `index()`（目録）を足す。
    2. 目録だけで済む provider（`metadata.units`・`dependency.*`）を、目録と SQL（`symbol`・`reference` 表）に移す。
    3. 木が要る provider は `await repository.load(type, ids)` で選んだ単位だけを読む。
3. LRU の大きさは E-1 の数字で決める。

**新しい型・関数（案）**

```ts
export type RepositoryUnitRef = { type: string; id: string; key: string; filePath: string };
export class Repository {
    /** 単位の目録 (木を読まない) */
    index(type?: string): RepositoryUnitRef[];
    /** 選んだ単位の木を読む (LRU) */
    load(type: string, ids?: readonly string[]): Promise<UnitParseResult[]>;
}
```

### E-3. 被依存を `reference` 表で引く・provider の 2 段化（P3）

- 被依存: `storeSqlite.ts` の `findReferences`（`reference_target` の索引）で引き、推移的な影響は再帰 CTE で求める。今のグラフは名前のそろえ方・子リレーションの解決・メンバーから単位へのまとめ上げをしてから辿るので、その処理を SQL の側にも持つか、グラフを残すかを E-1 の数字で決める。
- provider の 2 段化: 「SQL で対象（単位・本体・行）を選ぶ → 選んだ本体だけをメモリで解析する」。`report/snapshot.ts` の `snapshotInputOf`（今 38 か所で使っている）をやめ、provider の単位の status を構造の Diff に寄せる。
- `store.subtree(unitId, nodeId)`: node 表を `parent_id` の再帰 CTE で引き、本体の部分木だけを組み立てる。

**テスト**: `test/unit/store.test.ts`（findReferences・findSymbols・findMetrics の続き）、`store-golden.test.ts`。E-1 の数字が P0 より悪くならないこと（`docs/plan.md` 10 章 P3 の終わりの条件）。

---

## F. 古い処理を消す（P5）

`processor/Apex/` の古い walker・事実の抽出と、依存関係の古い抽出を消す。新しい解析（`semantic/`）で置き換え済みのもの（F-1）から先に、まだ使われているもの（F-2）は移してから、E-3 を待つもの（F-3）は最後に。

**消す前の確かめ方**: 消すものの名前で `grep -rn "<名前>" src test docs/examples` を取り、import しているところがすべて移ったことを確かめる。消したあと、全体テストと、依存関係・保存の置き場のゴールデンが変わらないこと（`baseline.ts`・`store.ts` を流して差分なし）を確かめる。

### F-1. すぐ消せるもの

| 消すもの                                                                                                                | 使っているところ（2026-11-27）                                                                                                                                                                                                                                                    | 手順                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `processor/Apex/commons.ts`（210 行）                                                                                   | なし（`Apex/diff/query/*` の `'./commons'` は別のファイル `diff/query/commons.ts`）                                                                                                                                                                                               | そのまま消す                                                                                                                                                                                                                                                                                                     |
| `processor/dependency/apexLegacy.ts`（708 行。`getLegacyApexDependencies`）                                             | `dependency/apex.ts:14`（コメントだけ）、`test/processor/apex-semantic-dependencies.test.ts`（7 行で import、64 行で使う。`EXPECTED_ONLY_OLD` は 30・93・98 行）                                                                                                                  | テストの「今の抽出の参照・定義が…」（70 行の `it`）と `EXPECTED_ONLY_OLD` を消す。ほかの `it`（103・135・163 行）は残す。コメントを消す                                                                                                                                                                          |
| `processor/Apex/calls.ts`（367 行。`analyzeApexUnit`・`makeApexInfoVisitor` ほか）                                      | `apexLegacy.ts`、`test/processor/apex-semantic-facts.test.ts`（7・48 行。このファイルの唯一のテストが古い抽出との比較）、`test/processor/apex-walker.test.ts`（5 行。174 行からの describe の 2 つのテスト）                                                                      | `apex-semantic-facts.test.ts` を消す（比較の役目は終わった。新しい事実のテストは `apex-semantic-*.test.ts` にある）。`apex-walker.test.ts` の 174 行からの describe を消す。そのあと `calls.ts` を消す                                                                                                           |
| 古い表示用の型 `processor/Metadata/view.ts`（`ObjectView`・`DependencyView`・`makeObjectViews` など。9 章で消すと決定） | `unit/processor.ts`（`getObjectViews`・`getDependencyViews`（291・302 行））、`processor/Metadata/index.ts`（re-export）、`docs/examples/metadata/scripts/run-diff.ts`、`test/processor/metadata-diff.test.ts`（263・280・286 行）。`report/types.ts:17` は `ViewStatus` だけ使う | `ViewStatus` を `report/types.ts`（か `report/schemas.ts` の `ViewStatusSchema` の型）に移す。`getObjectViews`・`getDependencyViews` を使う所がテストとサンプルのスクリプトだけなら、`object.list`・`object.diagram` の provider の結果に置き換えて消す。MCP・CLI から呼ばれていないことを `grep` で確かめてから |

**名前の重なりに注意**: `analyzeApexUnit` は `semantic/analyze.ts:162` にもあり、そちらが今使っている本物（`report/apex.ts`・`apexCallFlow.ts`・`dependency/apex.ts`）。`ApexDmlOperation`・`ApexCallType` も `semantic/facts.ts` に別の定義がある。消すのは `processor/Apex/calls.ts` の方だけ。

### F-2. 移してから消すもの: `processor/Apex/walker.ts`（401 行）

| 使っているところ                                                          | 使っているもの                                                                                                | 移し先                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `processor/Metadata/labelAnalysis.ts:4`（56・58 行）                      | `walkApexParseResult`・`apexDottedNameOf`                                                                     | `walkJson`（`processor/commons/node.ts`）で `System.Label.X`・`Label.X` の式を探す。点でつないだ名前は `semantic/call.ts` の名前の組み立てを使う   |
| `processor/Metadata/references.ts:5`（109 行。`@InvocableMethod` を探す） | `walkApexParseResult`                                                                                         | `semantic/declaration.ts` の宣言（注釈つきのメソッド）か、`walkJson` で `annotation` のノード                                                      |
| `processor/Apex/diff/unitBody.ts:39`（104 行）                            | `APEX_STATEMENT_KINDS`                                                                                        | `types/apex/statement.ts`（`StatementJson` の種類の一覧）に移す                                                                                    |
| `test/processor/apex-walker.test.ts`                                      | `ApexWalkContext`・`apexVariableOf`・`composeApexVisitors`・`walkApexParseResult`（92 行の describe の 4 つ） | walker と一緒に消す。34 行の `makeApexTypeNameOf` の describe は `semantic/type` のテストなので `test/processor/apex-semantic-type.test.ts` に移す |

使われていない export（`ApexVariableType`・`ApexScope`・`apexAnnotationsOf`・`ApexUnitContent`・`walkApexJson`）は walker と一緒に消える。

**手順**: 1 か所ずつ移し、そのたびに関係するテスト（`test/processor/metadata-*.test.ts`・ラベルの使用箇所のテスト）とラベルの使用箇所のゴールデン（`crossRef.labels` の出力）が変わらないことを確かめる。最後に `grep -rn "Apex/walker'" src test` が 0 件になってから消す。

### F-3. E-3 のあとに消すもの

| 消すもの                                                | 今の状態                                                                                                                                                                                                                                                  | 前提                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `report/snapshot.ts` の `snapshotInputOf`・`snapshotOf` | `registry.ts` で 38 か所、`test/processor/report-providers.test.ts` で 7 か所、`apex-rules.test.ts` で 1 か所。`report/crossRef.ts:12` が `snapshotOf`。`report/index.ts:33` が export                                                                    | E-3 の provider の 2 段化で、provider が SQL で単位を選ぶ形になってから |
| 解析の結果を覚える `WeakMap`                            | `report/apex.ts`（`analyses`・`unitInfos`・`unitMetrics`）、`apexCallFlow.ts`（`indexes`）、`apexFlow.ts`・`lwcFlow.ts`（`texts`）、`lwcEventFlow.ts`（`flows`）、`commons.ts`（`contexts`）、`permission.ts`（`analyses`）、`snapshot.ts`（`snapshots`） | 同上。`mask.ts` の `maskedRepositories` は解析の覚えではないので残す    |

**終わりの条件**: F-1・F-2 で `processor/Apex/` に古い walker・事実の抽出がなくなり、`unknowns.ts` の数が減るか変わらない。F-3 は E-3 と一緒に終わる。

---

## G. 見せる部品・雛形・文書の整理

8 章の「解析 → provider（データ）→ 部品（描き方）→ 雛形（ドキュメントの種類）」の一式を、段 1 から順にそろえる。解析は C・D で作ったものを使う。

- 図の自動配置は **elkjs**、チャートは **recharts** に決めた（`docs/plan.md` 8.5。2026-11-27）。dagre は使わない。
- まず配置の土台（G-2）を elkjs に替えてから、新しい図（G-3）を作る。両方のライブラリの機能（8.5 の表）を、部品の props から選べるようにする。

### 入力（今あるもの）

| 入力                      | 場所                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 部品のカタログ            | `src/report/catalog.ts` の `REPORT_COMPONENTS`（部品ごとの `props`（zod）と `description`）と `REPORT_DATA_BINDINGS`（データを受け取る props と、受け取れる出力の形 `shapes` か provider の名前 `providers`） |
| viewer の部品             | `src/viewer/report/registry.tsx` の `components`（カタログの名前 → 描く関数）と、`src/viewer/report/components/*.tsx`。描くのは `@xyflow/react`                                                               |
| 今の自動配置（替える）    | `src/viewer/autoNodeLayout.tsx` の `getLayoutedElements(nodes, edges, rankdir)`（dagre）。使っているのは `flowDiagram.tsx`・`codeFlowchart.tsx`（TB）・`eventFlow.tsx`・`objectDiagram.tsx` の 4 つ           |
| viewer の配り方           | `vite.report.config.ts` の `viteSingleFile()`（viewer を 1 つの HTML にまとめる）。Web Worker を使うときは、HTML に埋め込む形（Vite の `?worker&inline`）にする                                               |
| provider の登録と出力の形 | `src/analyzer/report/registry.ts` の `define`。出力の形 `ProviderShape` は今 `'rows' \| 'matrix' \| 'diagram' \| 'object'`                                                                                    |
| 依存関係のグラフ          | `src/analyzer/unit/dependencies.ts` の `dependencyGraphOf(repository)`（`DependencyGraph`: `nodes`・`edges`・`candidateEdges`）と、`processor/dependency/graph.ts` の `toLevel`（文・式 → メンバー → 単位）   |
| ソースの文字              | `src/analyzer/report/apexFlow.ts` の `sourceTextsOf(result)`（位置 → ソースの文字と行）                                                                                                                       |
| 表の部品                  | `src/viewer/report/components/rowsTable.tsx`（並べ替え・列の出し分け・CSV）と `src/report/tableData.ts`                                                                                                       |
| C・D の解析               | `semantic/cfg.ts`・`dataflow.ts`・`dynamicQuery.ts`・`loopOperations.ts`・`security.ts`、D の `apex.findings`                                                                                                 |
| 雛形                      | `src/report/templates.ts`（`documentOf`・`providerSource`）、`detailTemplates.ts`（1 件 1 ページの部分）、`templateList.ts` の `REPORT_TEMPLATES`、MCP のプロンプト `src/mcp/prompts.ts`                      |

### G-1. 出力の形 `graph`（段 1・高）

**決めたこと**: `graph`（ノードと線）を provider に共通の出力の形として足す（2026-11-27。`docs/plan.md` 9 章）。`GraphView` に渡す provider が 5 つ以上あり、elkjs の入れ子・接続口もこの形で渡すため。

**直すファイル**: `src/analyzer/report/registry.ts`（`ProviderShape` に `'graph'`）、`src/analyzer/report/schemas.ts`（`ReportGraphSchema`）、`src/analyzer/report/types.ts`、`src/report/catalog.ts`（`DataShape` に `'graph'`）、新規 `src/analyzer/report/graphData.ts`。

**新しい型・関数（案）**

```ts
// schemas.ts
export const ReportGraphSchema = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        /** 色分けの種類 (apexClass・apexMethod・lwc・object など) */
        type: z.string(),
        /** 入れ子の親 (クラスの中のメソッドならクラスのノードの id)。elkjs の compound node になる */
        parent: z.string().exactOptional(),
        /** 比べるときの状態 */
        status: z.enum(['added', 'removed', 'changed', 'unchanged']).exactOptional(),
        /** ページに分けた文書で、その単位のページ (viewer が押したときに開く) */
        unit: z.object({ type: z.string(), id: z.string() }).exactOptional(),
        /** 層 (architecture.layers の段。elkjs の partitioning) */
        layer: z.number().exactOptional(),
    })),
    edges: z.array(z.object({
        from: z.string(), to: z.string(),
        kind: z.string(),               // calls・uses・extends など (DependencyKind)。辺のラベルにもする
        candidate: z.boolean().exactOptional(), // 候補の辺 (インターフェース越しの呼び出し) は点線
        status: z.enum(['added', 'removed', 'changed', 'unchanged']).exactOptional(),
    })),
    /** 起点 (focus) と段数で絞ったとき、絞った条件 */
    focus: z.object({ node: z.string(), depth: z.number() }).exactOptional(),
});

// graphData.ts
/** 依存関係のグラフから、部品に渡すグラフを作る (細かさ・種類・起点と段数で絞る) */
export const reportGraphOf = (
    graph: DependencyGraph,
    options: {
        /** unit: 単位だけ / member: メンバーを単位の枠の中に入れる (parent を付ける) */
        level: 'unit' | 'member';
        nodeTypes?: readonly string[];
        edgeKinds?: readonly string[];
        focus?: string; depth?: number;     // 起点から両方向に depth 段
        includeCandidates?: boolean;        // candidateEdges も点線で入れる
        includeStandard?: boolean;          // 標準の型・オブジェクトも入れる (既定は入れない)
    },
): ReportGraph;
/** 2 時点のグラフを比べて status を付ける (ノードは id、辺は from・to・kind で対応付ける) */
export const compareReportGraphs = (before: ReportGraph | undefined, after: ReportGraph): ReportGraph;
```

**テスト**: `test/report/graph-data.test.ts`（新規）。細かさ（`member` でメンバーに `parent` が付く、`unit` で辺がまとまって重なりが 1 本）、種類・段数での絞り込み、候補の辺、比べたときの status。

### G-2. 図の自動配置を elkjs に移す（段 1・高）

**目的**: 今の 4 つの図と新しい図が、同じ配置の部品を通して elkjs の機能（8.5 の表）を使えるようにする。終わったら dagre を外す。

**新しいファイル**: `src/viewer/layout/elkLayout.ts`（elkjs の入力への変換・配置・出力からの変換。純粋な関数）、`src/viewer/layout/useElkLayout.ts`（React のフック。非同期の配置と「配置中」）、`src/viewer/layout/elkEdge.tsx`（elkjs の線の折れ点を描く辺の部品）、Worker を使うなら `src/viewer/layout/elk.worker.ts`。

**直すファイル**: `package.json`（`elkjs` を足し、`@dagrejs/dagre` を外す）、`flowDiagram.tsx`・`codeFlowchart.tsx`・`eventFlow.tsx`・`objectDiagram.tsx`、消す `src/viewer/autoNodeLayout.tsx`。

**新しい型・関数（案）**

```ts
// elkLayout.ts
export type ElkAlgorithm = 'layered' | 'mrtree' | 'radial' | 'force' | 'stress' | 'rectpacking';
export type ElkLayoutOptions = {
    algorithm?: ElkAlgorithm;                          // 既定 layered
    direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';      // layered・mrtree の向き
    edgeRouting?: 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE';
    spacing?: { node?: number; layer?: number };
    /** 入れ子をまたぐ線も含めて 1 回で配置する (hierarchyHandling: INCLUDE_CHILDREN) */
    hierarchy?: boolean;
    /** 元の順 (ソースの順) を保つ (considerModelOrder) */
    keepOrder?: boolean;
    /** そのほかの elkjs のオプション (キーは elk.* のまま。文書から渡すときの逃げ道) */
    extra?: Readonly<Record<string, string>>;
};
export type ElkPortSide = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type LayoutNode = {
    id: string; width: number; height: number;
    /** 入れ子の親 (枠になるノード)。枠の大きさは子から elkjs が決める */
    parentId?: string;
    /** 接続口 (ER 図の項目の行・分岐の真偽の口) */
    ports?: readonly { id: string; side: ElkPortSide; index?: number }[];
    /** 層の制約 (起点を最初の層・終点を最後の層に) */
    layerConstraint?: 'FIRST' | 'LAST';
    /** 層の番号 (partitioning) */
    partition?: number;
};
export type LayoutEdge = { id: string; source: string; target: string; sourcePort?: string; targetPort?: string; label?: string };
export type LaidOutNode = { id: string; x: number; y: number; width: number; height: number; parentId?: string };
export type LaidOutEdge = { id: string; points: { x: number; y: number }[]; labelPosition?: { x: number; y: number } };
/** elkjs で配置する (座標は親からの相対。React Flow の parentId と同じ) */
export const elkLayout = (
    nodes: readonly LayoutNode[],
    edges: readonly LayoutEdge[],
    options?: ElkLayoutOptions,
): Promise<{ nodes: LaidOutNode[]; edges: LaidOutEdge[] }>;
/** 入力を elkjs のグラフ (ElkNode) にする / 結果を戻す (テストのために分ける) */
export const toElkGraph: (...) => ElkNode;
export const fromElkGraph: (graph: ElkNode) => { nodes: LaidOutNode[]; edges: LaidOutEdge[] };

// useElkLayout.ts
export const useElkLayout = (
    nodes: readonly LayoutNode[], edges: readonly LayoutEdge[], options?: ElkLayoutOptions,
): { status: 'layout' | 'done' | 'error'; nodes: LaidOutNode[]; edges: LaidOutEdge[]; error?: string };
```

**手順**

1. `elkjs` を入れる（`elkjs/lib/elk.bundled.js` を main で使う形から始める）。`toElkGraph`・`fromElkGraph`・`elkLayout` を作り、node（テスト）でも動かす。
2. React Flow とのつなぎ: 入れ子は React Flow の `parentId`（子の座標は親からの相対）、線は `elkEdge.tsx` で elkjs の `sections`（始点・折れ点・終点）をそのまま描く（React Flow の既定の線は使わない）。
3. 図を 1 つずつ移す。
    - `flowDiagram.tsx`: `layered`・`RIGHT`・`ORTHOGONAL`。分岐（Decision）の箱の口を `EAST`・`SOUTH` に固定（ports）。開始の箱は `layerConstraint: FIRST`
    - `objectDiagram.tsx`: `layered`・`SPLINES`。項目の行を接続口にし、参照の線を項目の行から出す（`ports` に項目ごとの口。`showAllFields` のときも）
    - `eventFlow.tsx`: コンポーネントごとの枠（`parentId`）と `hierarchy: true`
    - `codeFlowchart.tsx`: `layered`・`DOWN`・`ORTHOGONAL`・`keepOrder`。ループ・try の箱を枠にして中の箱を入れ、戻りの線が枠の外を回るようにする（10 章の「繰り返しの戻り線が箱をまたいで交差する」を直す）。分岐の真・偽の口を左右に固定
4. 配置の重さ: 300 ノードを超える図は Web Worker で配置する（`elk-api` と Worker。`viteSingleFile` なので `?worker&inline` で HTML に埋め込む）。配置の間は「配置中」を出す。
5. `autoNodeLayout.tsx` と `@dagrejs/dagre` を消す（`grep -rn "autoNodeLayout\|dagre" src` で 0 件）。

**テスト**: `test/viewer/elk-layout.test.ts`（新規）。node の elkjs で、入れ子（子が親の枠の中）・接続口（線の端が口の位置）・層の制約（FIRST の箱が最初）・重ならないこと（箱の矩形が重ならない）を確かめる。画面は `npm run build:report` のあと、サンプルの文書（Flow・ER 図・処理フロー・イベントの流れ）で目で確かめ、HTML の大きさの増え方も見る。

**終わりの条件**: 4 つの図が elkjs で描かれ、dagre が依存から消える。処理フローの戻りの線が箱をまたがない。

### G-3. `GraphView`（段 1・高）

**新しいファイル**: `src/viewer/report/components/graphView.tsx`。純粋な部分は `src/viewer/report/graphViewModel.ts`。

**直すファイル**: `src/report/catalog.ts`（props と `REPORT_DATA_BINDINGS` に `GraphView: { prop: 'data', shapes: ['graph'] }`）、`src/viewer/report/registry.tsx`。

**props（案）**: elkjs の主なオプションを、文書を書く人・AI が選べるようにする。

```ts
GraphView: {
    props: z.object({
        data: bound('Graph (nodes and edges)'),
        layout: z.enum(['layered', 'tree', 'radial', 'force', 'stress']).nullable()
            .describe('layered: flows and dependencies (default) / tree: parent-child / radial: around the focus / force, stress: overview.'),
        direction: z.enum(['RIGHT', 'DOWN']).nullable().describe('For layered and tree. Default RIGHT.'),
        edges: z.enum(['orthogonal', 'splines', 'polyline']).nullable().describe('Edge routing. Default splines.'),
        nest: z.boolean().nullable().describe('Draw members inside their unit frames (uses node parent). Default true when parents exist.'),
        layers: z.boolean().nullable().describe('Fix rows by node layer (architecture layers).'),
        focus: z.string().nullable().describe('Node id to center on (radial uses it as the center; others highlight neighbors).'),
        height: z.number().nullable().describe('Height in px. Default 480.'),
    }),
    description: 'Node-and-edge graph (call graph, dependencies, component tree) laid out by ELK. Colors by type, frames for members, dashed candidate edges, edge labels, click to open the unit page.',
}
```

**手順**

1. `graphViewModel.ts`: `ReportGraph` と props から `LayoutNode`・`LayoutEdge`・`ElkLayoutOptions` を作る（`layout` → `algorithm`、`nest` → `parentId` と `hierarchy`、`layers` → `partition`、`focus` → `radial` の中心）。
2. `graphView.tsx`: `useElkLayout` で配置し、React Flow で描く。色は `type` ごとの表（`status` があれば `status.tsx` の色を優先）、候補の辺は点線、辺のラベルは `kind`。
3. 押したとき: `unit` があり、ページに分けた文書ならそのページへ（`PageLink` と同じ URL の作り方。`src/viewer/report/links.ts` を作って共通にする）。
4. 画面の中の絞り込み: 種類のチェックボックス、`focus` の段数（データは provider の段で絞り、画面では表示だけ）。
5. 大きいグラフ: 300 ノードを超えたら Worker で配置（G-2）。1000 を超えたら「種類か段数で絞ってください」と出し、先頭 1000 だけ描く。

**テスト**: `test/viewer/graph-view-model.test.ts`（新規）。props から elkjs のオプションと入れ子・層への変換。

### G-4. `Chart`（recharts。段 1・中）

**目的**: 行のデータ（`rows` の provider すべて）を、1 つの部品でいろいろなチャートにする。recharts の種類（8.5 の表）を props の `kind` で選び、列の割り当てで軸・大きさ・色を決める。

**新しいファイル**: `src/viewer/report/components/chart.tsx`、純粋な部分は `src/report/chartData.ts`（集計・Sankey の形への変換。テストできるように viewer の外に置く）。

**直すファイル**: `package.json`（`recharts`）、`src/report/catalog.ts`（props と `REPORT_DATA_BINDINGS` に `Chart: { prop: 'data', shapes: ['rows'] }`）、`src/viewer/report/registry.tsx`。`StatusSummary` に `chart: 'pie' | 'bar' | null` を足し、件数の割合を `Chart` で描く。

**props（案）**

```ts
Chart: {
    props: z.object({
        data: bound('Rows'),
        kind: z.enum(['bar', 'stackedBar', 'horizontalBar', 'pie', 'radar', 'scatter', 'treemap', 'sankey']),
        /** 列の割り当て (行のキー) */
        x: z.string().nullable().describe('Category / x column (bar, radar, scatter).'),
        y: z.union([z.string(), z.array(z.string())]).nullable().describe('Value column(s). Omit to count rows.'),
        size: z.string().nullable().describe('Bubble size (scatter) or area (treemap).'),
        color: z.string().nullable().describe('Color by this column (series / treemap color).'),
        group: z.string().nullable().describe('Stack or group by this column.'),
        source: z.string().nullable().describe('Sankey: source column.'),
        target: z.string().nullable().describe('Sankey: target column.'),
        aggregate: z.enum(['count', 'sum', 'average', 'max']).nullable().describe('How to combine rows with the same x. Default count.'),
        threshold: z.number().nullable().describe('Draw a reference line (e.g. complexity 10).'),
        top: z.number().nullable().describe('Show only the top N categories.'),
        height: z.number().nullable(),
    }),
    description: 'Chart of rows (bar, stacked, pie, radar, scatter, treemap, sankey) with tooltip, legend, threshold line and zoom.',
}
```

**新しい関数（案）**

```ts
// chartData.ts (画面に依存しない)
export type ChartMapping = { kind; x?; y?; size?; color?; group?; source?; target?; aggregate?; top? };
/** 行を recharts の data に集計する (x ごとに aggregate、group で系列に分ける、top で切る) */
export const chartDataOf = (rows: readonly Row[], mapping: ChartMapping): { data: Record<string, unknown>[]; series: string[] };
/** Sankey の nodes・links (source・target の列の組ごとに件数か y の合計) */
export const sankeyDataOf = (rows: readonly Row[], mapping: ChartMapping): { nodes: { name: string }[]; links: { source: number; target: number; value: number }[] };
/** Treemap の木 (group でまとめ、size を面積、color を色の値に) */
export const treemapDataOf = (rows: readonly Row[], mapping: ChartMapping): unknown[];
```

**手順**: `chartDataOf` などで集計 → `chart.tsx` で `ResponsiveContainer` の中に `kind` ごとの recharts の部品。どれにも `Tooltip`・`Legend`、`threshold` は `ReferenceLine`、行が多い `bar` は `Brush`（ズーム）。色は `status`・種類の色の表と同じものを使う。

**テスト**: `test/report/chart-data.test.ts`（新規）。集計（count・sum・average）、系列、top、Sankey と Treemap の形。画面は `npm run build:report` で、HTML の大きさの増え方も見る（recharts の分）。

### G-5. 段 1 の provider（高）

どれも「0. 共通の決まり」の provider の足し方で作る。`graph` の形の provider は G-1 の `reportGraphOf` を通す（G-1 の前に作るなら、行の形で先に出し、G-1 のあとに `graph` を足す）。

**使うグラフの事実**（`processor/dependency/graph.ts`）

- ノードの id は `<種類>:<名前>`（`apexClass:AccountService`・`apexMethod:AccountService.sync`・`lwc:accountList`・`field:Invoice__c.Amount__c`）。文・式の位置は `site:<単位のノード>:<sourceKey>`（`statement`・`expression`）。
- 細かさ（`NodeLevel`）は `unit`・`member`・`site`。辺の `from` は持てるいちばん細かいノード（式 → 文 → メンバー → 単位）。上の細かさにまとめるときは `toLevel(graph, id, level)`。
- 辺は `{ from, to, kind, via, unit, resolution? }`。候補の辺（オーバーロード・インターフェースの実装）は `graph.candidateEdges`（`from` はメンバーの細かさ）。
- 辿る関数: `getDependencies` / `getDependents(graph, node, { depth?, level?, kinds? })`（`Map<id, 段>`）、`getCycles`（855 行）、`toMermaid` / `toDot`。

#### `apex.callGraph`・`apex.classDependencies`

- **新しいファイル**: `src/analyzer/report/apexCallGraph.ts`
- **作り方**:
    - `apex.callGraph`: `kind: 'calls' | 'creates'` の辺のうち、両端が Apex（`apexClass`・`apexTrigger`・`apexMethod`・`apexProperty`）のもの。`from` を `toLevel(…, 'member')` にまとめる（文・式の位置はメソッドに）。メソッドのノードは `parent` にクラスを付けて枠の中に入れる。`includeCandidates` なら `candidateEdges` も点線（`candidate: true`）で。
    - `apex.classDependencies`: 同じ辺と `uses`・`extends`・`implements` を `toLevel(…, 'unit')` にまとめ、同じ組の辺は 1 本に（`kinds` の集合と本数 `count` を持たせる）。
    - `focus` と `depth`: `getDependencies` と `getDependents` を両方向に辿って、範囲のノードだけにする。
    - 比べるとき: 2 時点のグラフで作り、G-1 の `compareReportGraphs` で status を付ける。
- **引数（案）**: `{ classes?: string[]; focus?: string; depth?: number (1〜10、既定 2); includeCandidates?: boolean; includeTests?: boolean; includeStandard?: boolean }`
- **出力**: `graph`（G-1 の前は行 `{ from, to, kind, count, candidate? }`）
- **テスト**: `test/report/apex-call-graph.test.ts`。メソッドがクラスの枠に入る、クラスの細かさで辺が 1 本にまとまる、`focus` と `depth` の範囲、候補の辺、テストクラスの除外、比べたときの status。

#### `dependency.graphData`

- **直すファイル**: `report/dependency.ts`（`getDependencyDiagram(input, { targets?, depth?, format? })`（124 行）の隣）
- **作り方**: `dependency.graph`（Mermaid・DOT の文字）と同じ範囲の選び方（`targets` の単位のノードと、両方向に `depth` 段）で、`reportGraphOf(graph, { level: 'unit', ... })` を返す。`dependency.graph` の範囲の選び方を関数に切り出して共通にする。
- **引数**: `dependency.graph` と同じ（`format` を除く）に `nodeTypes?`・`edgeKinds?`。
- **テスト**: `dependency.graph` と同じノードの集合になること。

#### `dependency.cycles`

- **新しいファイル**: `src/analyzer/report/dependencyCycles.ts`
- **作り方**: 今の `getCycles`（`graph.ts:855`）が何を返すかを先に確かめ、足りなければ単位の細かさのグラフで強連結成分（Tarjan）を求める。2 つ以上の単位を含む成分を行に。`graph` の形では、成分ごとの枠のノード（`type: 'cycle'`）を作り、単位に `parent` を付ける。
- **行（案）**: `{ cycle: number; size: number; units: { type; name }[]; kinds: string[] }`。比べるときは単位の集合をキーにして added / removed。
- **引数**: `{ types?: string[]; edgeKinds?: string[] }`（既定は `calls`・`uses`・`extends`・`implements`・`creates`。`places` などの画面の配置は入れない）
- **テスト**: 3 つの単位の循環と 2 つの循環、自己の呼び出しを入れない、`edgeKinds` で絞る。

#### `lwc.componentTree`

- **新しいファイル**: `src/analyzer/report/lwcComponentTree.ts`
- **作り方**: LWC → LWC の辺のうち `kind: 'places'`・`via: 'template'`（テンプレートの `<c-foo>`）。親から子へ渡す属性（`lwcProperty`・`kind: 'writes'`・`via: 'template.attribute'`）を辺のラベルに（渡すプロパティの名前の一覧）。置き場所（FlexiPage → LWC）も根として足す（`lwc.placements` と同じ元）。動的な import（`via: 'importCall'`）・`querySelector`（`via: 'query'`）は点線。
- **行（案）**: `{ parent; child; via; properties: string[] }`。`graph` の形では `GraphView` の `layout: tree`。
- **引数**: `{ components?: string[]; depth?: number; includePages?: boolean }`
- **テスト**: 親子の辺、渡すプロパティ、置き場所の根、`depth`。

#### `lwc.callGraph`

- **直すファイル**: `report/lwcComponentTree.ts` に足すか、`report/lwcCallGraph.ts`
- **今の状態**: モジュールをまたぐ関数の呼び出し（`c/utils` の `formatAmount()`）はグラフにない。`processor/Lwc/calls.ts` の `LwcCallInfo` に `callType: 'module'`（`target` は import の名前、`source` はモジュール、`imported` は export の名前）として出ているだけ。グラフの LWC の参照は `from.member` を持たない（どの関数からかが分からない）。
- **作り方**: `analyzeLwcModuleCalls(module)` を本体ごとに読み、`callType: 'module'` の呼び出しを「呼ぶ側の本体（`owner`・`member`）→ 呼ばれるモジュールの関数（`source` を `c/<名前>` から LWC の単位に解決し、`imported` の関数）」の辺にする。`callType: 'apex'` も入れれば、LWC の関数から Apex のメソッドまでつながる。
- **出力**: `graph`（関数を LWC の枠の中に）と行 `{ from: { component; member }; to: { module; function }; callType }`。
- **テスト**: `c/utils` の名前つきの import と default の import、相対パス（`./helper`）、Apex の呼び出し。

#### `lwc.apexCalls`

- **直すファイル**: `report/lwc.ts`（`getLwcApexCalls`）
- **作り方**: グラフの LWC → `apexMethod` の辺（`via: 'import'`・`via: 'wire'`）を行に。`via: 'import'` のうち、本体で実際に呼んでいるか（`LwcCallInfo` の `callType: 'apex'`）で `imperative` と「import だけ」に分ける。Apex のメソッドのノードの `traits`（`auraEnabled`・`cacheable`）を列に。`@wire` なのに `cacheable` でないものは `problem`。
- **行（案）**: `{ component; apexClass; method; mode: 'wire' | 'imperative' | 'importOnly'; auraEnabled; cacheable; problem? }`
- **引数**: `{ components?: string[]; classes?: string[] }`
- **使い道**: `Chart` の `sankey`（`source: component`・`target: apexClass`。オブジェクトまでつなぐなら `object.usage` と合わせる）。
- **テスト**: wire・imperative・import だけ、cacheable でない wire の `problem`。

#### `apex.symbols`

- **新しいファイル**: `src/analyzer/report/apexSymbols.ts`
- **作り方**: `unitDependenciesOf(type, result).definitions`（`UnitDefinition = { defType, name, sourceKeys?, traits? }`）を行に。保存の置き場では `symbol` 表と同じもの（E-3 のあとは SQL で引く）。行番号は `sourceTextsOf`。
- **行（案）**: `{ defType; name; unit; line?; traits?: string[] }`
- **引数**: `{ kinds?: string[]; names?: string[]; classes?: string[] }`（`names` は前方一致も）
- **テスト**: クラス・メソッド・プロパティ・内部クラス、`kinds` で絞る。

#### `crossRef.fieldUsage`・`lwc.fieldUsage`

- **新しいファイル**: `src/analyzer/report/fieldUsage.ts`
- **作り方**: `object.usage`（`report/crossProject.ts` の `getObjectUsage`（104 行））の項目の細かさ版。辺の先が `field` か `fieldPath`（関係のパスは最後の項目に解決済み）のものを、（項目, `toLevel(from, 'unit')`）でまとめ、操作（`OPERATIONS`（29 行）の読む・書く）を集める。`lwc.fieldUsage` は `from` が `lwc:` のものだけ（`via: 'wire.fields'`・schema の import を含む）。
- **出力**: `matrix`（行は項目、列は単位、セルは `R` / `W` / `RW`）。G-8 の `Matrix` の一般化が前提。先に行 `{ object; field; unit; unitType; reads; writes; vias: string[] }` で出す。
- **引数**: `{ objects?: string[]; fields?: string[]; types?: string[] }`
- **テスト**: SOQL の SELECT（読む）・DML の項目（書く）・関係のパス・LWC の wire の項目。

### G-6. 段 2 の部品（中）

どれも「部品の足し方」で作る。画面に依存しない計算は `*Model.ts` に分けてテストする。

#### `FindingsList`

- **新しいファイル**: `src/viewer/report/components/findingsList.tsx`、`src/viewer/report/findingsModel.ts`
- **データ**: `apex.findings`・`lwc.findings`・`metadata.findings`（`REPORT_DATA_BINDINGS` は `providers` で 3 つ）。行は D の `FindingRowSchema`。
- **props（案）**: `{ data: bound('Findings'); groupBy: 'rule' | 'unit' | 'severity' | null; showChart: boolean | null; severity: ('error' | 'warning' | 'info')[] | null }`
- **描き方**: 上に重さ × 分類の件数（`Chart` の積み上げ棒。G-4 の部品をそのまま中で使う）。下に `RowsTable`（重さの色・ルール・単位・場所）。行を開くと、ルールの説明（`rule.description`）、根拠（`evidence.path` を `GraphView` の小さな図か、矢印でつないだ文字で）、ソースの抜き出し（`CodeView` ができたら、その行の前後 3 行）。
- **テスト**: `findingsModel.ts` のまとめ方（`groupBy`・重さの絞り込み・件数）。

#### `CodeView`

- **新しいファイル**: `src/viewer/report/components/codeView.tsx`
- **データ**: `apex.sourceMarks`（G-7）。`{ unit; lines: { number; text }[]; marks: { line; kind; message; ref? }[] }`。比べるときは before / after の 2 つ。
- **props（案）**: `{ data: bound('Source with marks'); from: number | null; to: number | null; kinds: string[] | null; sideBySide: boolean | null }`
- **描き方**: 行番号・ソース・行の印（印の種類ごとの色と、余白のアイコン）。印の上にマウスで説明。`from`・`to` で範囲だけ。比べるときは左右に並べ、変わった行に色。構文の色付けは入れない（大きさを増やさない。要るなら後で）。
- **テスト**: 範囲の切り出しと、印の種類の絞り込み（`codeViewModel.ts`）。

#### `DataFlowGraph`

- **新しいファイル**: `src/viewer/report/components/dataFlowGraph.tsx`
- **データ**: `apex.variables`（G-7）の `graph` の形。ノードは定義（`def:<sourceKey>`）と読み（`use:<sourceKey>`）、辺は「定義 → 届く読み」。文の枠（`parent: stmt:<sourceKey>`）の中に定義と読みを入れる。
- **描き方**: `GraphView` の配置（`layered`・`DOWN`・`keepOrder`・`hierarchy: true`）をそのまま使い、ノードの色は定義 / 読み、ラベルは変数の名前と値（定数なら値、unknown なら理由）。動的 SOQL の文字列の組み立ても同じ形（`segmentsOf` の穴を読みとして）。
- **props（案）**: `{ data: bound('Variable flow graph'); variable: string | null; height: number | null }`

#### `ExecutionOrder`

- **新しいファイル**: `src/viewer/report/components/executionOrder.tsx`
- **データ**: `automation.executionOrder`（G-7）。行 `{ step: number; stepName; kind; unit; timing?; condition? }`。
- **描き方**: 段（before トリガー → 入力規則 → … → after Flow）ごとの帯。elkjs の `layered`・`DOWN` と `partitioning`（`partition` = `step`）で段を縦に固定し、段の中の単位を横に並べる。同じ段に複数の単位（順が決まらないトリガーが 2 つなど）があれば注意の印。
- **props（案）**: `{ data: bound('Execution order'); object: string | null; event: ('insert' | 'update' | 'delete' | 'undelete')[] | null }`

### G-7. 段 2 の provider（中）

| provider                    | 新しいファイル（案）            | 作り方                                                                                                                                                                                                                                                                                                                                                                          | 引数（案）                           | 行・形（案）                                                                                                                                      |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apex.variables`            | `report/apexVariables.ts`       | `analysisOf(result)` の本体ごとに `apexDataflowOf(semantics)`。`semantics.accesses` の読みごとに `reachingDefinitions(access)` と `valueOf(access)`。変数はローカル変数と引数だけ（フィールドは追わない、と行の説明に書く）                                                                                                                                                     | `classes`・`members`・`variables?`   | 行 `{ className; member; variable; access: 'def' \| 'use'; line; reaching?: number[]; value?: string; unknownReason? }`。`graph` も               |
| `apex.dynamicQueries`       | `report/apexDynamicQueries.ts`  | 本体ごとに `apexDynamicQueriesOf(semantics)`。`text`（穴は `{?}`）・`objects`・`fields`・`restoration`                                                                                                                                                                                                                                                                          | `classes`・`restoration?`            | 行 `{ className; member; language; restoration; text; objects; fields; line }`                                                                    |
| `apex.sourceMarks`          | `report/apexSourceMarks.ts`     | 1 単位のソースの行（`sourceTextsOf` から行の並び）と印: 指摘（D の `apexRuleFindingsOf`）・届かない文（H-3 と同じ計算）・ループの中の操作（`apexLoopOperationsOf`）・守り方のない SOQL / DML（`apexSecurityChecksOf`）・変数の読み書き（`variable` を渡したときだけ）。`sourceKeys` → 行番号は `sourceTextsOf` の `line`                                                        | `class`（1 つ）・`member?`・`kinds?` | `object`（`CodeView` の形）                                                                                                                       |
| `apex.testMap`              | `report/crossProject.ts` に足す | `getApexTests(input, { depth })`（262 行）の行（`{ unitType, name, tests: [{ test, via, depth }] }`）を、テストクラス × 本体の行列に。セルは `{ via; depth }`                                                                                                                                                                                                                   | `classes?`・`depth?`                 | `matrix`（G-8 の一般の形）                                                                                                                        |
| `apex.impact`               | `report/apexImpact.ts`          | `requiresComparison: true`。2 時点の `apex.metrics`（`getApexMetrics`）をメソッドで対応付けて増減、`apex.dataAccess` の項目・条件の増減、変わったメソッド（構造の Diff の changed のメンバー）から呼び出しグラフを逆に辿った範囲（`getDependents(graph, id, { kinds: ['calls'], depth })`）と、その中のトリガー・テスト（`apex.tests` と同じ辿り方）。after にだけある指摘（D） | `classes?`・`depth?`                 | 行 `{ member; change: 'added' \| 'removed' \| 'changed'; metrics: { key; before; after }[]; impacted: { type; name; depth }[]; tests: string[] }` |
| `automation.executionOrder` | `report/executionOrder.ts`      | `automation.byObject`（`report/flow.ts` の `getAutomationByObject`（230 行）。`analyzeAutomation`）の単位を、保存の順の段に並べる。段の表は Salesforce の公式資料（Triggers and Order of Execution）から `docs/reference/execution-order.json` に作り、出典と API の版を書く（Salesforce のリリースの更新のスキルの対象に足す）                                                 | `objects?`・`events?`                | 行 `{ object; event; step; stepName; kind; unit; timing? }`                                                                                       |

**テスト**: provider ごとに `test/report/<名前>.test.ts`。サンプルの Apex（`ParserTest.dynamicSoqlExample` など）で代表の行を確かめる。`apex.impact` は 2 時点のサンプル（`docs/examples/repository` の before / after）で。

### G-8. 今ある部品の拡張（中・低）

| 部品                           | 直すファイル                                                                                              | 中身と手順                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTable` の列の書式         | `catalog.ts`（props）・`rowsTable.tsx`・`src/report/tableData.ts`                                         | props に `columns: { key; label?; format?: 'bar' \| 'threshold' \| 'badge' \| 'link'; threshold?: number; max?: number }[] \| null`。`bar` はセルの中の CSS の棒（最大は `max` か列の最大）、`threshold` は閾値を超えたら色、`badge` は値ごとの色（重さ・status）、`link` は B-11 のページへのリンク。`columns` があればその順と見出し（列の出し分けの初期値にもする）。CSV にも `columns` の順を使う |
| `StatusSummary`                | `catalog.ts`・`status.tsx`                                                                                | props に `chart: 'pie' \| 'bar' \| null`。件数の割合を `Chart`（G-4）で                                                                                                                                                                                                                                                                                                                               |
| `Matrix` の一般化              | `report/schemas.ts`（`matrixSchema`（70 行））・`report/types.ts`（`Matrix<V>`）・`components/matrix.tsx` | 今の列は権限を持つもの（`PermissionHolderRef`）に決め打ち、セルのキーは `${type}:${name}`、値は `flagsText`（CRED などの文字）。列を `{ key; label; group? }`、セルの値を `V` のまま、描き方を props の `format: 'flags' \| 'text' \| 'check' \| null` にする。権限の行列（`permission.objectAccess`・`fieldAccess`）は `group` に種類、`format: 'flags'` で今と同じ見た目にする                      |
| `CodeFlowchart`                | `components/codeFlowchart.tsx`・`report/apexFlow.ts`                                                      | G-2 の elkjs への移行に加えて: 箱に `unreachable`（`reachableApexCfgNodes`）・`loopOperation`（`apexLoopOperationsOf`。呼び出しの先も）の印を `apexFlow.ts` で付け、灰色・強調の枠で描く。箱を押すとソース（`CodeView`）。図の中の検索（箱の文字の一致を強調）                                                                                                                                        |
| `FlowDiagram`・`CodeFlowchart` | 両方と新規 `src/viewer/layout/nodes.tsx`                                                                  | 箱の形（開始・終了は角丸、分岐はひし形、ループは六角形）と色の表を共通の部品に                                                                                                                                                                                                                                                                                                                        |
| `EventFlow`                    | `components/eventFlow.tsx`                                                                                | コンポーネントごとの枠（G-2 の入れ子）                                                                                                                                                                                                                                                                                                                                                                |
| `SequenceDiagram`              | `components/sequenceDiagram.tsx`                                                                          | 呼び出しの活性区間（呼び出しから戻りまでの縦の帯）と返り値、長い図を段ごとに折りたたむ、横に動かしたときの参加者の見出しの固定（`position: sticky`）                                                                                                                                                                                                                                                  |
| `AutomationView`               | 専用のビュー                                                                                              | 実行順の表示を `ExecutionOrder` に任せ、`AutomationView` は単位の一覧と中身に絞る                                                                                                                                                                                                                                                                                                                     |

### G-9. 雛形（8.4）

**直すファイル**: `src/report/templates.ts`（新しい雛形の関数）、`domainTemplates.ts`、`detailTemplates.ts`（1 件 1 ページの部分）、`templateList.ts`（`REPORT_TEMPLATES` に登録）、`src/mcp/prompts.ts`（`DOMAIN_PROMPTS` と `registerPrompt`）、`src/mcp/context.ts`（`SERVER_INSTRUCTIONS` の雛形の名前。B-5 のあとは自動）。データの宣言は `providerSource` / `ReportProviderSource` で書く（引数の誤りが型検査で分かる）。

| 雛形                         | 中身（部品 ← provider）                                                                                                                                                                                                                                                                              | 前提        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `architecture_overview`      | クラス間の依存の図（`GraphView` の `layered` ← `apex.classDependencies`）、全体の俯瞰（`GraphView` の `stress`）、循環（`DataTable` と `GraphView` ← `dependency.cycles`）、種類から種類への依存の量（`Chart` の `sankey`）、レイヤー（段 3 の `architecture.layers` を `GraphView` の `layers` で） | G-1〜G-5    |
| `code_quality_overview`      | メトリクスの分布（`Chart` の `bar`・`scatter`（複雑度 × 文の数））、大きさと複雑度（`Chart` の `treemap`）、クラスごとの品質の形（`Chart` の `radar`）、使われないメソッド（`apex.unusedMethods`）、届かない文（H-3）、指摘（`FindingsList`）                                                        | G-4・G-6・D |
| `test_overview`              | テストと本体の対応（`Matrix` ← `apex.testMap`）、テストのある・ないの割合（`Chart` の `pie` ← `apex.tests`）、テストのないクラス（`apex.tests` の `untestedOnly`）                                                                                                                                   | G-4・G-7    |
| `apex_specification` に追加  | メソッドごとの呼び出しグラフ（`GraphView` の `radial`、`focus` はそのメソッド ← `apex.callGraph`）、変数の流れ（`DataFlowGraph`）、動的クエリ（`apex.dynamicQueries`）、メソッドの `signature`（H-2）                                                                                                | G-3・G-7    |
| `security_overview` に追加   | CRUD/FLS・共有の指摘（`FindingsList`）、守り方の割合（`Chart` の積み上げ棒 ← `apex.security`（H-1））、ループの中の SOQL・DML（`apex.loopOperations`（H-1））                                                                                                                                        | D・H-1      |
| `automation_overview` に追加 | オブジェクトごとの実行順（`ExecutionOrder`）                                                                                                                                                                                                                                                         | G-6・G-7    |
| `lwc_overview` に追加        | コンポーネントの親子の図（`GraphView` の `tree` ← `lwc.componentTree`）、LWC → Apex → オブジェクトの流れ（`Chart` の `sankey` ← `lwc.apexCalls`）                                                                                                                                                    | G-3〜G-5    |

**手順（雛形ごと）**: 雛形の関数を書く → `REPORT_TEMPLATES` とプロンプトに登録 → `npm run catalog`（`docs/catalog/templates/*.json`）→ サンプルのリポジトリで `npx ttsx --noCheck src/cli/index.ts report build <雛形>` を作り、画面を目で確かめる。

**テスト**: 今のテスト（雛形がそのまま `validate_report_spec` を通る。`test/mcp/report-tools.test.ts`）に、新しい雛形を足す。

### G-10. 文書の整理（10 章「文書」）

- 未統合の文書（`docs/` の `analysis-plan.md`・`commons.md`・`implementation-roadmap.md`・`ir-integration.md`・`ir-types.md`・`ir.md`・`json-gaps.md`・`json-redesign-plan.md`・`lwc-snapshot-plan.md`・`object-translation.md`・`report-components-plan.md`・`report-document-format.md`・`save-format-plan.md`・`todo.md`）を読み、未完了の作業・方針・未確認のことを `docs/plan.md` に移して消す。利用者向けの書き方（`report-document-format.md` など）は残す。`ir-types.md` の 5.3・5.4・6 章は A-3 が参照しているので、A-3 の表に要点を移してから消す。
- コードのコメントにある、消した文書への参照（`grep -rn "docs/[a-z0-9-]*\.md" src` で今 328 か所）を、`docs/plan.md` の節にするか消す。`docs/catalog/generate.ts` と `docs/examples/*/scripts` も同じ。
- 進め方: 文書を 1 つずつ。消す前に `grep -rn "<文書の名前>" src docs test` で参照を一覧にして直す。1 つ消すごとに prettier と typecheck（コメントだけなら typecheck は要らない）。

### G-11. 段 3・調査（必要になってから）

| 項目                           | 作り方の要点                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DependencyMatrix`             | 単位 × 単位の依存の行列。G-8 の一般の `Matrix` に、行と列の並べ替え（依存の多い順・循環の成分ごと）を足したもの                                                                                                                                                                                                      |
| `DiffTree`                     | 構造の Diff（`commons/diff`）の木を、added / removed / changed の印つきで開閉できる木に                                                                                                                                                                                                                              |
| `apex.slice`                   | 1 つの文（`Database.query(q)` など）から、`apexDataflowOf` の到達定義を逆に辿った文の集合。`CodeView` の印で見せる                                                                                                                                                                                                   |
| `architecture.layers`          | クラスの名前の決まり（`*Controller`・`*Service`・`*Selector`・`*Domain`）と設定ファイル（B-6）の指定でレイヤーを決め、逆向きの依存を違反として行に。`GraphView` の `layers` で段を固定                                                                                                                               |
| `architecture.communities`     | 単位の細かさのグラフでコミュニティ検出（Louvain）。コミュニティを枠（`parent`）にして `GraphView` の `force`                                                                                                                                                                                                         |
| `git.hotspots`・`git.coupling` | 今の `src/analyzer/parser/git.ts` は差分のファイルの一覧（`git diff --name-status`）と中身（`git show`）だけで、履歴は読まない。`git log --name-only --format=...` を読む関数（`GitParser.getHistory`）を足し、ファイル → 単位に対応付けて、変更の回数・同時に変わった組を数える。`Chart` の `treemap`・`scatter` で |
| 調査                           | Salesforce のリリースの更新のスキル（`.claude/skills/salesforce-release-update`）の定期実行（`/schedule`）、標準の項目の収集（9 章「標準オブジェクト・項目をどの情報源で確かめるか」の項目の側）など                                                                                                                 |

---

## H. 一覧から見えた追加と修正（`docs/report-inventory.md` 5 章）

C でできた解析のうち、まだ provider で見られないものを出し、今ある provider の列を足す。D・G と独立に進められる（D の前に H-1 を作ると、指摘にする前のリスクの一覧として使える）。

### H-1. `apex.loopOperations`・`apex.security`（中）

**新しいファイル**: `src/analyzer/report/apexRisks.ts`

**作り方**: 単位ごとに `analysisOf(result)`・`unitInfoOf(result)`（`report/apex.ts`）を取り、`apexLoopOperationsOf(analysis, facts)`・`apexSecurityChecksOf(analysis, facts)` の結果を行にする。行番号は `sourceTextsOf(result)`。比べるときは `compareKeyed`（キーは下の表。行番号は入れない）。

| provider              | 引数（案）                                                                                                   | 行（案）                                                                                      | キー                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `apex.loopOperations` | `classes?`・`kinds?`（soql・sosl・dynamicQuery・dml）・`via?`（direct・call）・`includeTests?`（既定 false） | `{ ...rowBaseShape, className; member; kind; operation?; via; path?: string[]; line? }`       | `className:member:kind:operation:path`   |
| `apex.security`       | `classes?`・`enforcement?`（`none` だけなど）・`kind?`（query・dml）・`includeTests?`                        | `{ ...rowBaseShape, className; member?; kind; detail; enforcement; sharing?; owner?; line? }` | `className:member:kind:detail:sourceKey` |

**テスト**: `test/report/apex-risks.test.ts`。ループの中の直接の SOQL・呼び出しの先の DML（`path`）・届かない文は出ない、守り方の 5 種類、`with sharing` の有無、テストの除外、比べたときの status。

### H-2. 今ある provider の列（中）

| provider                              | 直すファイル                                                                                                           | 直すこと                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apex.dataAccess`                     | `report/apex.ts`（`accessItemsOf`（296 行）・`getApexDataAccess`（389 行））、`ApexDataAccessRowSchema`                | 列 `restoration?`（動的クエリの行だけ。`ApexQueryFact.restoration`）と `enforcement?`（`apexSecurityChecksOf` の結果を `sourceKey` で突き合わせる）。`inLoop` は直接のまま、列 `loopVia?: 'call'`（`apexLoopOperationsOf` の `via: call` の操作に印） |
| `apex.metrics`                        | `report/apex.ts`（`getApexMetrics`（239 行）・`metricsOf`）、`semantic` のメトリクス                                   | 列 `soqlInLoopViaCalls`・`dmlInLoopViaCalls`（`apexLoopOperationsOf` の `via: call` の数をメンバーごとに）                                                                                                                                            |
| `dependency.missing`                  | `report/dependency.ts`（`getMissingRows`（89 行））                                                                    | 引数 `includeUnknown?`（既定 false）。`true` なら `origin: unknown` のノードも出す。列 `origin`                                                                                                                                                       |
| `object.usage`・`crossRef.references` | `report/crossProject.ts`（`getObjectUsage`）・`report/crossRef.ts`（`getReferenceUsages`（128 行））                   | 列 `vias: string[]`（辺の `via` の集合。`soql.select`・`soql.dynamic`・`SObject.get` など）。動的・文字列の名前から来た参照を見分ける                                                                                                                 |
| `apex.entryPoints`                    | `report/apexEntryPoints.ts`（`getApexEntryPoints`（54 行））                                                           | 列 `problem?`: `aura` の行で、LWC の `@wire` から使われているのに `cacheable` でない（`referenceFindingsOf` の `APEX_METHOD_NOT_CACHEABLE`、または辺の `via: 'wire'` とノードの `traits`）                                                            |
| `apex.outline`                        | `report/apex.ts`（`getApexOutline`（112 行））、`src/report/detailTemplates.ts`・`src/mcp/prompts.ts` の `m.signature` | 列 `signature`（`name(Type1, Type2): Return`）。オーバーロードを見分ける。雛形の `m.signature` を直し、`npm run catalog`                                                                                                                              |
| `metadata.findings`                   | `report/crossRef.ts`                                                                                                   | D-3 の列（`rule`・`member`・`line`・`evidence`）を同時に                                                                                                                                                                                              |

列を足すと行のスキーマが変わるので、`npm run catalog` と、その provider のテストの期待値を直す。ゴールデン（`docs/examples/analysis/output`）は provider の出力を持たないので変わらない。

### H-3. `apex.unreachable`（中）

- **新しいファイル**: `report/apexRisks.ts` に足す
- **作り方**: 本体ごとに `apexDataflowOf(semantics)` の `cfg` で `reachableApexCfgNodes(cfg)` を取り、`cfg.nodes` のうち届かない `statement` のノードを行に。続く届かない文はまとめて 1 行（最初の行と最後の行）。理由は前の文の種類（`return`・`throw`・`break`・`continue`）から。
- **引数**: `classes?`・`includeTests?`
- **行（案）**: `{ ...rowBaseShape, className; member; fromLine; toLine; reason: 'afterReturn' | 'afterThrow' | 'afterBreak' | 'afterContinue' | 'other' }`
- **注意**: 定数の条件で実行されない分岐（`if (false)`）は今の CFG では届く（辺を切っていない）。`docs/plan.md` 10 章の「到達性解析」の残りとして、定数の条件は `dataflow` の定数の伝播で辺を切る形で別に足す。
- **テスト**: `return` のあと・`throw` のあと・ループの中の `break` のあと・届く文は出ない。

### H-4. 部品の修正（低）

| 部品            | 直すこと                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTable`     | `sourceKeys` か `line` を持つ行で、「ソースへ」のリンク（`CodeView` のページのその行。B-11 の `pageIndex` と G-8 の `format: 'link'`） |
| `CodeFlowchart` | `apex.loopOperations` の `via: call` の操作も、呼び出しの箱に印（G-8 の `loopOperation` の印に含める）                                 |

**終わりの条件**: H-1・H-3 の provider がカタログに出て、`security_overview`・`code_quality_overview` の雛形（G-9）から使える。H-2 の列がカタログと雛形に反映される。

---

## I. Apex・LWC・Flow の解析の揃え（`docs/report-inventory.md` 6 章）

Apex にある解析の手法を、LWC と Flow にもそろえる。対応表と足りない解析は `docs/report-inventory.md` 6.1・6.2。ここは作り方。Flow から先に進める（Flow のループの中の操作とメトリクスは、Apex の H-1 と並べてすぐ使える）。

### I-0. 共通の行の形

3 つをまとめる provider（`code.*`）と部品で並べるため、行に共通の列を持たせる。

```ts
// report/schemas.ts
export const codeLocationShape = {
    /** apexClass・apexTrigger・lwc・flow */
    unitType: z.string(),
    unit: z.string(),
    /** Apex はメソッド、LWC はメンバー・関数、Flow は要素の名前 */
    member: z.string().exactOptional(),
    /** Apex・LWC の行番号 */
    line: z.number().exactOptional(),
};
```

Apex の今の provider（`apex.metrics` の `className`・`member` など）は列の名前を変えない（雛形が使っている）。新しい provider から `codeLocationShape` を使い、横断の provider で Apex の行をこの形に直す。

### I-1. Flow の解析（`processor/Metadata/flowAnalysis.ts` に足すか、`flowSemantics.ts` を新しく）

**入力**: `analyzeFlows` が作る `FlowGraph`（`{ flow; nodes: { id; kind; label? }[]; edges: { from; to; edgeType }[] }`。接続は `types/metadata/flow.ts` の決まりで要素の外の `edges` に出ている）と、要素の中身（`flow.elements` と同じ元）。

| 解析             | 作り方                                                                                                                                                                                                                                                                                                                                                                                   | 新しい関数（案）                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ループの中の操作 | Loop 要素ごとに、「各項目」の辺（`edgeType` の名前は `nextValueConnector` か確かめる）の先から、Loop 要素に戻るまでに通る要素を DFS で集める（「最後の項目のあと」の辺の先は含めない）。その中の `recordLookups`・`recordCreates`・`recordUpdates`・`recordDeletes`・`subflows`・`actionCalls`（Apex のアクション）を拾う。サブフローは呼ぶ Flow の中も辿る（深さ 3 まで、循環は止める） | `flowLoopOperationsOf(flow, graph, resolveSubflow?): FlowLoopOperation[]` |
| メトリクス       | 要素の種類ごとの数、`cyclomatic` = 分岐の辺の数 − 分岐の要素の数 + 1（Decision の結果の数・Loop・失敗の経路を数える）、`maxNesting` = 入れ子のループの深さ、最長の経路（DAG にして）、サブフローの深さ                                                                                                                                                                                   | `flowMetricsOf(flow, graph): FlowMetrics`                                 |
| データアクセス   | `flowRefs.ts` の要素の参照（`queriedFields`・`inputAssignments`・`outputAssignments`・条件の行）を、要素ごとに `{ object; fields; operation: 'query' \| 'insert' \| 'update' \| 'delete' }` にまとめる。ループの中かは上の結果から                                                                                                                                                       | `flowDataAccessOf(flow, graph): FlowDataAccess[]`                         |
| 実行の文脈       | `runInMode`（`types/metadata/flow.ts:37`）と、ない場合の既定（起動の種類による。公式資料で確かめて `docs/reference/` に出典）を、`ApexAccessEnforcement`・共有と同じ言葉に直す（`SystemModeWithoutSharing` → `systemMode` と `without sharing`）                                                                                                                                         | `flowSecurityOf(flow): { enforcement; sharing; explicit: boolean }`       |
| 使われない資源   | `variables`・`constants`・`formulas`・`textTemplates`・`choices` の名前のうち、要素・数式・テキストテンプレートの差し込み（`flowRefs.ts` の `{!名前}`）から参照されないもの。入力・出力の変数（`isInput`・`isOutput`）は除く                                                                                                                                                             | `flowUnusedResourcesOf(flow): FlowResource[]`                             |

**テスト**: `test/processor/flow-semantics.test.ts`（新規）。ループの中の Get Records と DML、ループのあとの要素は入らない、入れ子のループ、サブフローの先、メトリクスの値、`runInMode` の 3 種類と既定、使われない変数（入力の変数は除く）。サンプルの Flow（`docs/examples/repository`）に、ループの中の DML の Flow がなければ足す。

### I-2. Flow の provider

| provider               | 行（案）                                                                                                                                        | 引数（案）                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `flow.metrics`         | `{ ...rowBaseShape, flow; elements; decisions; loops; dataElements; actions; screens; cyclomatic; maxNesting; longestPath; subflowDepth }`      | `flows?`・`minComplexity?`  |
| `flow.loopOperations`  | `{ ...rowBaseShape, flow; loop; element; kind: 'query' \| 'dml' \| 'subflow' \| 'apex'; object?; via: 'direct' \| 'subflow'; path?: string[] }` | `flows?`・`kinds?`          |
| `flow.dataAccess`      | `{ ...rowBaseShape, flow; element; object; fields; operation; inLoop }`                                                                         | `flows?`・`objects?`        |
| `flow.security`        | `{ ...rowBaseShape, flow; triggerType?; runInMode?; enforcement; sharing; explicit }`                                                           | `flows?`・`systemModeOnly?` |
| `flow.unusedResources` | `{ ...rowBaseShape, flow; resource; resourceType }`                                                                                             | `flows?`                    |

比べるときは `compareKeyed`（キーは `flow:element`・`flow:resource` など）。`flow.findings` は D と一緒に、`metadata.findings` の source `flow` を移して作る（`FLOW_DML_IN_LOOP`・`FLOW_QUERY_IN_LOOP` のルールを足す）。

### I-3. LWC の解析と provider

| 項目               | 作り方                                                                                                                                                                                                                                                                                       | provider（案）                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ループの中の操作   | `analyzeLwcModuleCalls` の `LwcCallInfo` のうち `context.loopDepth > 0` で `callType` が `apex`・`lds`・`refreshApex` のもの（`lwc.metrics` の `apexCallsInLoop` と同じ条件）を、場所（`sourceKeys` → 行）つきで行に。呼ぶ関数の先（同じモジュールの関数）を辿るのは LWC の CFG ができてから | `lwc.loopOperations`: `{ component; member; callType; target; line }`                                 |
| LDS の書き込み     | `callType: 'lds'` の呼び出しのうち `updateRecord`・`createRecord`・`deleteRecord` の引数（`{ apiName, fields }`・`fields` の中の schema の import）から、オブジェクトと項目を解決する。`@wire(getRecord, { fields })` の読みと合わせる                                                       | `lwc.dataAccess`: `{ component; member?; object; fields; operation; via: 'wire' \| 'lds' \| 'apex' }` |
| 文字列の項目       | 先に今の範囲を確かめる（`@wire` の設定の文字列は `via: 'wire.fields'` で拾っている）。`getFieldValue`・`getFieldDisplayValue` の 2 つ目の引数、`fields`・`optionalFields` の文字列の配列を、Apex の `namedReferences.ts` と同じく「定数か、値の解析で決まるもの」だけ参照にする              | 依存関係に入る（`via: 'string'`）。`DERIVED_VERSION` を上げる                                         |
| メンバーの読み書き | 10 章 P4 段 2 の「`this.<メンバー>` の読み書きの解析」。テンプレートの式・getter・メソッドの中の `this.x` を読み書きに分け、使われない `@api`・プロパティ・メソッドを求める                                                                                                                  | `lwc.unusedMembers`: `{ component; member; kind; isApi }`                                             |
| Jest のテスト      | `parser/Lwc/folder.ts` で飛ばしている `__tests__/` のうち `*.test.js` を、テストのファイルとして読む（中身の解析はせず、`import` と `createElement('c-xxx', { is: Xxx })` だけ）。`unitType.ts` の読み方と保存の形に影響するので、LWC の `UNIT_FORMAT_VERSIONS` を上げる                     | `lwc.tests`: `{ component; tests: string[] }`                                                         |

### I-4. 横断の provider（`report/code.ts`）

`code.loopOperations`・`code.security`・`code.tests` は、Apex・LWC・Flow の provider の行を `codeLocationShape` に直して 1 つにする。`code.loopOperations` は Flow の Apex のアクション → `apex.loopOperations`、LWC の Apex の呼び出し → Apex の側も辿り、「LWC のループの中から呼んだ Apex の中の SOQL」のような経路を `path` に出す。引数は `unitTypes?`（既定は全部）と各 provider の絞り込み。

**テスト**: provider ごとに `test/report/<名前>.test.ts`。横断は、3 つの provider の行の数の合計と一致すること、`unitTypes` で絞れること。

### I-5. ほかの解析の手法（`docs/report-inventory.md` 6.4）

どれも「provider の足し方」で作る。行は I-0 の `codeLocationShape` を使う。

| provider                         | 新しいファイル（案）              | 作り方                                                                                                                                                                                                                                                                                                                                                                                                                          | 前提                                            |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `automation.cascade`             | `report/automationCascade.ts`     | `crossProject.ts` の `apexLinksOf(graph)`（`dml`: 単位 → オブジェクト → 事象、`triggersOf`: オブジェクト → トリガー）に、記録トリガーフロー（`FlowInfo.object`・`recordTriggerType`）と Flow の DML（I-1 の `flowDataAccessOf`）を足し、起点のオブジェクトと事象（insert / update / delete）から幅優先で辿る。行 `{ depth; from: { unitType; unit }; object; event; to: { unitType; unit } }`。起点に戻る辺は `recursive: true` | I-1                                             |
| `automation.fieldWriteConflicts` | `report/automationCascade.ts`     | オブジェクトごとに、項目への書き込み（Apex の `apex.dataAccess` の書き込み、Flow の `inputAssignments`・`$Record` への割り当て、項目の自動更新（ワークフロー））を集め、2 つ以上の単位が書く項目を行に。保存中のレコードへの書き込み（before トリガーの `Trigger.new` の要素の項目・before-save Flow）とほかのレコードへの DML を `target: 'self' \| 'other'` で分ける。実行順（G-7）の段も付ける                               | I-1・G-7                                        |
| `apex.governorEstimate`          | `report/apexGovernor.ts`          | 入口（`apex.entryPoints`）から呼び出しグラフを辿り、メソッドごとの SOQL・DML の数（`apex.metrics`）を足し上げる。ループの中（`apexLoopOperationsOf`）と再帰は `unbounded: true`。トリガーの中の DML は保存の連鎖で動くトリガーの数も足す。行 `{ entry; soql; dml; unbounded; path }`。上限（SOQL 100・DML 150）と比べた割合も                                                                                                   | H-1・`automation.cascade`                       |
| `apex.querySelectivity`          | `report/apexQuerySelectivity.ts`  | SOQL の WHERE の条件の行（`semantic/query.ts`）と Flow の Get Records の条件ごとに、項目が索引ありか（`docs/reference/indexed-fields.json` の標準の表と、項目の定義の `externalId`・`unique`・参照）を見る。索引のある条件が 1 つもない、`!=`・`NOT IN`・先頭が `%` の LIKE だけ、WHERE も LIMIT もない、を行に                                                                                                                 | 索引の表の出典                                  |
| `apex.exceptions`                | `report/apexExceptions.ts`        | CFG の例外の辺を、`throw` の型と `catch` の型で絞る（`semantic/cfg.ts` の try の近似を、型を見る形に広げる）。メソッドごとに「出る例外の型」を要約し、呼び出しグラフで入口まで伝える（10 章「メソッド間の要約」の一部）。`@AuraEnabled` から `AuraHandledException` 以外が出るものを D の指摘に                                                                                                                                 | CFG の型の照合                                  |
| `apex.async`                     | `report/apexAsync.ts`             | 事実の `async`（`System.enqueueJob`・`Database.executeBatch`・`System.schedule`・`@future` の呼び出し）と `publish` を辺にし、非同期の中から非同期を呼ぶ連鎖を行に。制限（future から future・Batch の中の future）を `problem` に                                                                                                                                                                                              | なし                                            |
| `integration.callouts`           | `report/integration.ts`           | 事実の `callout` の位置と、`HttpRequest.setEndpoint` の引数の値（`dataflow.ts` の `valueOf`。`callout:<名前>` は指定ログイン情報への参照にする）、Flow の HTTP コールアウトのアクション、LWC の `fetch`。`integration_overview` の雛形（今は `crossRef.references` だけ）に足す                                                                                                                                                 | なし                                            |
| `security.effectiveAccess`       | `report/effectiveAccess.ts`       | `permission.apexAccess`（権限 → Apex クラス）× `apex.entryPoints`（クラス → 入口）× `apex.dataAccess`・`apex.security`（入口から呼び出しグラフで届く読み書きと守り方）。システムモードの経路は `bypassesObjectPermission: true`。行 `{ holder; entry; object; operation; enforcement }`                                                                                                                                         | H-1                                             |
| `object.picklistUsage`           | `report/picklistUsage.ts`         | 「選択リストの項目と比べている文字列の定数」を集める: Apex は `==` / `!=` / `IN` の片方が項目の読み（`apexTypeMember`）でもう片方の値が定数（`valueOf`）、SOQL の WHERE、Flow の条件の行、数式の `ISPICKVAL` / `TEXT`。`object.picklists` の値と突き合わせ、ない値は `problem`                                                                                                                                                  | なし                                            |
| `code.hardcoded`                 | `report/code.ts`                  | 3 つの文字列の定数（Apex は `dataflow.ts` の定数、Flow は定数・数式・割り当て、LWC は文字列のリテラル）を、値の形（15 / 18 桁の Id、`https://`、`.my.salesforce.com`、プロファイル・利用者の名前の列挙）で分ける。D の `HARDCODED_ID` と同じ判定の関数を共通に（`processor/commons/literals.ts`）                                                                                                                               | なし                                            |
| `code.hardcodedText`             | `report/code.ts`                  | 利用者に見せる文字の場所の表（LWC のテンプレートの文字・`label`・`title`・`alternative-text` の属性、`ShowToastEvent` の `title` / `message`、Apex の `addError`・`AuraHandledException` の引数、Flow の画面の文字）にある文字列の定数のうち、ラベルの参照でないもの                                                                                                                                                            | なし                                            |
| `dependency.coupling`            | `report/dependency.ts`            | 単位の細かさのグラフで、単位ごとの入る辺（Ca。ほかの単位の数）・出る辺（Ce）・不安定さ（Ce / (Ca + Ce)）。`Chart` の `scatter`（Ca × Ce）で見せる                                                                                                                                                                                                                                                                               | なし                                            |
| `code.clones`                    | `report/codeClones.ts`            | 文・ブロックの JSON から、名前・定数・位置を伏せた形のハッシュ（`commons/diff` の正規化を使えるか確かめる）を作り、一定の大きさ（文 5 つ以上）で同じハッシュを持つ組を行に。Flow は要素の種類と接続の並びのハッシュ                                                                                                                                                                                                             | なし                                            |
| `change.testSelection`           | `report/change.ts`                | `requiresComparison: true`。変わった単位（構造の Diff）から、`apex.tests` と同じ辿り方（呼び出し・DML で動くトリガー・Flow）で届くテストを集める。出力に `RunSpecifiedTests` に渡す `--tests` の文字列も                                                                                                                                                                                                                        | `automation.cascade`                            |
| `dependency.deploymentOrder`     | `report/dependency.ts`            | `getDeploymentOrder`（`graph.ts:899`）を行に（段・単位）。循環のある単位は同じ段にして `cycle: true`                                                                                                                                                                                                                                                                                                                            | なし                                            |
| `metadata.apiVersions`           | `report/metadata.ts`              | 単位の `-meta.xml` の `apiVersion`（Apex・LWC・Flow・Aura・Visualforce・トリガー）を集め、`sfdx-project.json` の `sourceApiVersion` と比べて古いものに印                                                                                                                                                                                                                                                                        | `apiVersion` を単位の base に持たせるか確かめる |
| トリガーの作りの決まり           | `semantic/rules.ts`（D のルール） | `MULTIPLE_TRIGGERS_PER_OBJECT`（`automation.byObject` で 1 オブジェクトに 2 つ以上）、`LOGIC_IN_TRIGGER`（トリガーの本体の文の数が閾値より多い）、`MIXED_DML`（同じ本体で設定オブジェクトと一般のオブジェクトを DML。設定オブジェクトの表を `docs/reference/` に）                                                                                                                                                              | D                                               |

**テスト**: provider ごとに `test/report/<名前>.test.ts`。サンプルのリポジトリにない形（再帰する連鎖、同じ項目への 2 つの書き込み、非選択的なクエリ、選択リストにない値）は、テストの中の小さなリポジトリで作る。

### I-6. そのほかの候補（`docs/report-inventory.md` 6.5。すべて含める）

6.5 の候補はすべて含める（2026-11-27 決定）。優先は 6.5 の表の仮の優先の順で、高から作る。どれも「provider の足し方」で作り、指摘にするものは D のルールの表（`APEX_RULES`）か `lwc.findings` に足す。上限・危険な権限・非推奨などの表は `docs/reference/` に出典つきで置き、Salesforce のリリースの更新のスキル（`.claude/skills/salesforce-release-update`）の対象に足す。

#### 権限・共有（6.5.1）

| provider                           | 新しいファイル（案）          | 作り方                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permission.highRisk`              | `report/permissionRisk.ts`    | `permission.effective` の結果（権限セットグループを展開したもの）のシステム権限・オブジェクトの ModifyAll / ViewAll を、`docs/reference/high-risk-permissions.json`（名前・危険の度合い・理由）と突き合わせる。行 `{ holder; permission; level; reason }` |
| `permission.redundancy`            | 同上                          | 権限を持つものごとに権限の集合（システム権限・オブジェクトの CRUD・項目の FLS・Apex クラス）を作り、包含（A ⊆ B）・一致・ほぼ一致（Jaccard 0.9 以上）の組を行に                                                                                           |
| `permission.unused`                | 同上                          | グラフで、権限セットグループからも、ほかのメタデータからも参照されない権限セット。割り当ては組織のデータが要ると説明に書く                                                                                                                                |
| `sharing.model`                    | `report/sharing.ts`           | オブジェクトの定義の `sharingModel`・`externalSharingModel`、`SharingRules` のメタデータ（所有者・条件の規則と、条件の項目）、主従関係の子（`ControlledByParent`）を、オブジェクトごとの行に。条件の項目は参照にする（`DERIVED_VERSION`）                 |
| `permission.sensitiveFields`       | `report/permissionRisk.ts`    | 項目の `securityClassification`・`complianceGroup`（10 章「項目の属性の残り」で読む）が付いた項目 × `permission.fieldAccess` × データアクセス（Apex・LWC・Flow）                                                                                          |
| `permission.customPermissionUsage` | `report/permission.ts` に足す | `namedReferences.ts` に `FeatureManagement.checkPermission('名前')` を足して参照にし、グラフの `customPermission` の参照をカスタム権限ごとに集める。参照のないカスタム権限は `unused`                                                                     |
| `security.guestExposure`           | `report/sharing.ts`           | `CustomSite` の `guestProfile`（または `Network`）を読み、そのプロファイルの `permission.apexAccess`・`objectAccess` と、届く入口（`apex.entryPoints`）を行に                                                                                             |

#### セキュリティ（6.5.2）

| provider・ルール                  | 新しいファイル（案）           | 作り方                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `security.xss`                    | `report/securityXss.ts`        | LWC: `calls.ts` の `callType: 'innerHTML'` とテンプレートの `lwc:dom="manual"`。Visualforce: `processor/Metadata/markup.ts` で `escape="false"` の `apex:outputText` など。Aura: `aura:unescapedHtml`。行 `{ unitType; unit; kind; line }` |
| `security.soqlInjection`          | `report/apexRisks.ts` に足す   | `apexDynamicQueriesOf` で `restoration` が `partial` / `none` のもののうち、穴の値の定義を `reachingDefinitions` で辿って `String.escapeSingleQuotes` も `:変数`（バインド）も通らないもの。テイント解析（10 章）の手前の近似と明記        |
| `security.sensitiveLogging`       | 同上                           | 事実の `debug` の引数の式に、名前の表（`password`・`token`・`secret`・`ssn` など）に当たる変数・項目、機密の分類の項目が含まれるもの                                                                                                       |
| 秘密情報のハードコード            | `report/code.ts`（6.4）        | `code.hardcoded` の種類に `secret`（変数名が名前の表に当たり、値が 16 文字以上の英数字の定数）                                                                                                                                             |
| `apex.entryPoints` の列 `sharing` | `report/apexEntryPoints.ts`    | `apexSecurityChecksOf` と同じ `sharing` をクラスから取り、列に。`without sharing` か宣言なしの入口に `problem`                                                                                                                             |
| `integration.endpoints`           | `report/integration.ts`（6.4） | `RemoteSiteSetting`・`CspTrustedSite`・`NamedCredential` の一覧と、`integration.callouts` の宛先の突き合わせ（許可がない宛先・使われない許可）                                                                                             |
| 弱い暗号・開いたリダイレクト      | `semantic/rules.ts`            | `WEAK_HASH`（`Crypto.generateDigest` の第 1 引数の定数が MD5・SHA1）。`OPEN_REDIRECT` はテイント解析のあと                                                                                                                                 |

#### テストの質（6.5.3）

| provider                | 新しいファイル（案）        | 作り方                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apex.testQuality`      | `report/apexTestQuality.ts` | テストメソッドごとに、事実の `assert` の数（同じクラスの private の補助メソッドの中も数える）、`Test.startTest` / `stopTest` の有無、`@TestSetup` の有無（クラス）、Id の直書き（`code.hardcoded` と同じ判定）、ループの回数の定数が 200 以上の DML（まとめ処理のテスト）、Factory らしいクラスの呼び出し。行 `{ className; method; asserts; startStop; testSetup; bulk; hardcodedIds; usesFactory }` |
| `TEST_IS_RUNNING_TEST`  | `semantic/rules.ts`         | テストでないクラスの `Test.isRunningTest()` の呼び出し                                                                                                                                                                                                                                                                                                                                                |
| `apex.coverageEstimate` | `report/apexTestQuality.ts` | `apex.tests` の辿り方でテストから届くメソッドを集め、届くメソッドの文の数（`apex.metrics` の `statements`）÷ クラスの文の数。分岐の中も届くとみなす近似で、実際の網羅率ではないと説明に書く                                                                                                                                                                                                           |

#### 上限・データモデル（6.5.4）

| provider                  | 新しいファイル（案）      | 作り方                                                                                                                                                                                         |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `object.limits`           | `report/objectLimits.ts`  | `object.fields` の型ごとの数、参照・主従・積み上げ集計・項目履歴の数を、`docs/reference/object-limits.json`（エディションごとの上限）と比べて割合を出す。設定（B-6）でエディションを選ぶ       |
| `object.unusedFields`     | 同上                      | グラフで、項目のノード（`field:<オブジェクト>.<項目>`）に入る辺を、`from` の単位の種類（コード・Flow・数式・レイアウト・レポート・権限）で分け、権限・レイアウトだけのもの・何もないものを行に |
| `dependency.managed`      | `report/dependency.ts`    | `origin: managed` のノードを名前空間ごとに集め、使う単位の数と種類を行に                                                                                                                       |
| `object.modelShape`       | `report/objectLimits.ts`  | オブジェクトの関係のグラフで、孤立のオブジェクト・最長の参照の連なり・多態の参照の使用箇所                                                                                                     |
| `object.formulaSize`      | 同上                      | 数式の項目の文字の数に、参照する数式の項目の文字の数を足し上げた見積もり（上限 5,000 文字・コンパイル後 15,000 バイトの近似）                                                                  |
| `object.fieldTypeChanges` | `report/object.ts` に足す | `requiresComparison: true`。2 時点の項目の型の違いと、その項目を使う単位（`getDependents`）                                                                                                    |
| `object.picklists` の列   | `report/object.ts`        | 値の数・無効の値・`object.picklistUsage`（6.4）での使用の有無                                                                                                                                  |

#### コードの品質・保守（6.5.5）

| provider・ルール         | 新しいファイル（案）                | 作り方                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code.deprecated`        | `report/code.ts`                    | 標準型の表に非推奨の印（10 章「標準 API の調査の残り」で集める）を足し、呼び出しの解決で当たるものを行に。LWC はテンプレートの `if:true` / `if:false`、Aura の古い機能                                        |
| `code.unusedSymbols`     | `report/code.ts`                    | Apex: `dataflow.ts` で読みのない定義だけの変数・引数（オーバーライド・インターフェースの実装の引数は除く）、読まれない private のフィールド。LWC: 使われない import（モジュールの import の表と識別子の参照） |
| 例外の握りつぶし         | `semantic/rules.ts`・`lwc.findings` | `EMPTY_CATCH`（文のない catch、`System.debug` だけの catch）。LWC は `catch` の本体が空か `console.*` だけ                                                                                                    |
| 残したデバッグ           | 同上                                | `DEBUG_STATEMENT`（Apex の `System.debug`。既定は無効）、LWC の `console.*`（`calls.ts` に `callType: 'console'` を足す）                                                                                     |
| `apex.classMetrics`      | `report/apex.ts`                    | クラスごとのメンバーの数・フィールドの数・文の数の合計・最大の引数の数・凝集度（LCOM4: フィールドを共有するメソッドのつながりの成分の数）                                                                     |
| `code.documentation`     | `report/code.ts`                    | 先に Apex・LWC の JSON がコメントを持つか確かめる（持たなければ、ソースの文字から宣言の直前のコメントを探す）。公開メソッド・`@api` のうちコメントのないもの                                                  |
| `code.naming`            | `report/code.ts`                    | 設定（B-6）の `naming` の規則（種類ごとの正規表現）と、定義（`apex.symbols`）・LWC・Flow・項目の名前を突き合わせる                                                                                            |
| `code.todos`             | `report/code.ts`                    | ソースの文字から `TODO`・`FIXME`・`HACK` のコメントを行番号つきで                                                                                                                                             |
| `NON_BULK_TRIGGER`       | `semantic/rules.ts`                 | トリガーの本体と、そこから呼ぶメソッドの中で `Trigger.new[0]`・`Trigger.old[0]`（添字が定数 0）を使い、`Trigger.new` を回すループがないもの                                                                   |
| ループの中の重い呼び出し | `semantic/loopOperations.ts`        | `kind` に `describe`（`Schema.getGlobalDescribe`・`describeSObjects`・`getDescribe`）を足す                                                                                                                   |
| ループの入れ子の深さ     | `processor/commons/metrics.ts`      | `SyntaxMetrics` に `maxLoopNesting`（ループだけの入れ子）を足す。Apex・LWC・Flow（I-1）で同じ名前                                                                                                             |

#### LWC・画面（6.5.6）

| provider・ルール     | 新しいファイル（案）        | 作り方                                                                                                                                                                                                   |
| -------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lwc.accessibility`  | `report/lwcQuality.ts`      | テンプレートの要素と属性を規則の表（`img` に `alt`、`lightning-button-icon` に `alternative-text`、`input` に `label` など）と突き合わせる。基本の部品の属性表（`standardComponentAttributes.ts`）を使う |
| テンプレートの決まり | `processor/Lwc/analysis.ts` | `MISSING_FOR_EACH_KEY`・`DEPRECATED_IF_DIRECTIVE`・`UNUSED_LWC_REF` を `LwcAnalysisCode` に足す                                                                                                          |
| LWS・Locker との相性 | 同上                        | `window.*` への代入・`eval`・`new Function`・`document.querySelector`（自分のテンプレートの外）を `calls.ts` で拾い、`LWS_UNSAFE_API`                                                                    |
| `lwc.styles`         | `report/lwcQuality.ts`      | スタイルシートの JSON の宣言から、色・余白の直書き（`#`・`rgb(`・`px`）と、SLDS のクラスの表にない `slds-*`                                                                                              |
| `lwc.apexCalls` の列 | `report/lwc.ts`（G-5）      | 同じ Apex のメソッドを複数の `@wire` で取る、imperative の更新のあとに `refreshApex` がない                                                                                                              |
| `page.load`          | `report/page.ts`            | `flexiPage.detail` の部品 → `lwc.metrics` の Apex の呼び出し・`@wire` の数を、ページごとに足し上げる                                                                                                     |

#### メタデータの種類の残り（6.5.7）

| provider                    | 新しいファイル（案）       | 作り方                                                                                                                                                                                                                                      |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `automation.legacy`         | `report/automation.ts`     | ワークフロールール（条件・アクション。10 章「自動化の中身」）と、プロセスビルダー（Flow の `processType: Workflow`）を一覧にし、Flow に移すときの対応（条件 → 記録トリガーフローの開始条件、項目の自動更新 → before-save の割り当て）を列に |
| `analytics.reports`         | `report/analytics.ts`      | レポートの種類・列・条件の項目、ダッシュボード → レポートを読む（メタデータの JSON の確かめから）。項目の参照は `object.unusedFields` の「レポート」の種類になる                                                                            |
| `customMetadata.references` | `report/customMetadata.ts` | カスタムメタデータ型のレコードの値のうち、クラス・項目・Flow の名前に当たる文字列（設定 B-6 で「この項目は名前」と指定するか、リポジトリの単位の名前と完全に一致するもの）を参照にする（`DERIVED_VERSION`）                                 |
| `event.flow`                | `report/integration.ts`    | プラットフォームイベントごとに、発行（事実の `publish`、Flow の Create Records）と購読（イベントのトリガー、Flow の起動、LWC の `lightning/empApi` の `subscribe`）                                                                         |
| `staticResource.usage`      | `report/metadata.ts`       | 静的リソースの大きさ・種類・参照の数                                                                                                                                                                                                        |
| `action.list`               | `report/page.ts`           | クイックアクション・グローバルアクションの対象・項目・置き場所                                                                                                                                                                              |
| `site.detail`               | `report/sharing.ts`        | `ExperienceBundle`・`Network`・`CustomSite` を読む（読み取りがないので、メタデータの種類の登録から）                                                                                                                                        |

#### 変更・運用（6.5.8）

| provider                     | 新しいファイル（案） | 作り方                                                                                                                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `change.breaking`            | `report/change.ts`   | `requiresComparison: true`。`apex.interface`・`lwc.interface`・`flow.interface` の比較で、削除・型の変更・必須の追加を「壊す変更」とし、使う側（`getDependents`）を付ける |
| `change.destructiveManifest` | 同上                 | 構造の Diff の removed の単位から `destructiveChanges.xml` の文字（`toPackageXml` と同じ組み立て）                                                                        |
| `change.packageManifest`     | 同上                 | 引数の単位・`feature.scope` の結果・変わった単位から `package.xml`（API の版は `sourceApiVersion`。10 章の決めることにあり）                                              |
| `change.risk`                | 同上                 | 変わった単位ごとに、影響の数（`dependency.impact`）・テストの有無（`apex.tests`）・複雑度（`apex.metrics`）・入口か（`apex.entryPoints`）から点数。重みは設定（B-6）      |

#### 解析の手法そのもの（6.5.9 の「なし」）

| 手法                     | 置き場所（案）                  | 作り方                                                                                                                                      |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ループの回数の推定       | `semantic/loopBounds.ts`        | `for (i = 0; i < 定数; i++)` と、定数の大きさのコレクション（`new List<…>(定数)` は除く）の for-each から上限を出す。分からなければ unknown |
| 文字列の値の集合         | `semantic/dataflow.ts` を広げる | `ApexValue` に `{ kind: 'set'; values: string[] }`（上限 8 個）。合流点で定数を集合にまとめる。`dynamicQuery.ts` は集合の各値で復元する     |
| コレクションの中身の追跡 | `semantic/dataflow.ts` を広げる | `List<SObject>`・`List<Object>` の `add` の引数の型を集め、DML・`for` の要素の型を絞る（`semantic/type.ts` の型と合わせる）                 |

**終わりの条件**: `docs/report-inventory.md` 6.1 の △・× のうち 6.2 の優先が高・中のものが ○ になり、`code_quality_overview`・`security_overview` の雛形（G-9）で 3 つを並べて見せられる。
