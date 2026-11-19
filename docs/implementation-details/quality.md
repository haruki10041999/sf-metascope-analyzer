# 6. 品質（テスト・CI・道具）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-168"></a>

## 168. 画面のテスト

**解決したい問題** 配置やスタイルを変更したあと、Apexの詳細ページや図が想定通り描けるか画像で確認したい。

**現行コード** test/report/components.test.ts はSSRの確認が中心。ブラウザでの実際のサイズ・描画・遷移を再現するテストがない。

**主な修正先** [`package.json`](../../package.json)、[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)、[`test/report/components.test.ts`](../../test/report/components.test.ts)

**新規パス候補** `playwright.config.ts`、`test/browser/report.spec.ts`、`test/browser/report.spec.ts-snapshots/`

**コード修正案** 既存のviewerビルドとサンプルHTMLを固定環境で配信し、主要操作と画像をPlaywrightで検証する。時間やフォントで変わる部分の条件を固定する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 既存の viewer ビルドとサンプル生成処理をテストの準備で呼ぶ。SSRテストの `components.test.ts` は既存の検証を継続する。

#### 既存型の直接変更なし

**方針**

- 本体のviewer型は変更不要。テスト設定は Playwright の公開型を使う。

#### 新規関数 `prepareBrowserReportFixture`

**引数・戻り値**

```text
prepareBrowserReportFixture(outputRoot: string): Promise<string>
```

**方針**

- ブラウザテストで目次→詳細へ遷移し、表示完了を待って画像を比較する。
- 必要ならfixture生成を準備用関数にまとめる。

#### 新規型なし

**方針**

- 新規の本体型は不要。固定した画面幅、フォント、画像比較はテスト設定で指定する。

**処理・互換性の補足** 固定フォント、画面幅、テストデータで viewer を起動し、表示準備完了後に画像比較する。表、図、ページリンクについて、主要な操作は状態やリンクでも確認する。

**変更コード案**

```ts
// test/browser/report.spec.ts
test('generated report links to a detail page', async ({ page }) => {
    await page.goto('/fixtures/report/index.html');
    await expect(page.getByRole('heading', { name: 'レポート' })).toBeVisible();
    await page.getByRole('link', { name: 'AccountService' }).click();
    await expect(page.getByRole('heading', { name: 'AccountService' })).toBeVisible();
    await expect(page).toHaveScreenshot('apex-page.png', { animations: 'disabled' });
});
// playwright.config.ts は viewport、fixture サーバー、撮影時のフォントを固定する。
```

**確認ケース** 初回ベースライン作成と再実行を行い、タイミングで画像が揺れないことを確認する。

<a id="implementation-detail-169"></a>

## 169. サンプルの出力を作り直す

**解決したい問題** 最新の組込み雛形の目次とページを、サンプル入力から繰り返し生成したい。

**現行コード** run-report.ts は既に writeReportSite を使ってページ分割に対応する。入口は単一の specs ファイル指定で、組込み雛形をまとめて再生成する流れはない。

**主な修正先** [`docs/examples/report/README.md`](../../docs/examples/report/README.md)、[`docs/examples/report/scripts/run-report.ts`](../../docs/examples/report/scripts/run-report.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)

**新規パス候補** `docs/examples/report/output/`

**コード修正案** 既存の単一specモードを保ち、雛形名または選択集合で回す入口を追加する。比較用 inputFor を共有し、出力先と生成件数を明確にする。

### 関数・型の変更一覧

#### 既存関数 `main`

**引数・戻り値**

```text
main(): Promise<void>
```

**方針**

- `run-report.ts` の `main` を既存specファイルまたは複数の組込み雛形を受けるよう変更する。

#### 既存関数 `loadSampleInput`

**引数・戻り値**

```text
loadSampleInput(): Promise<{ before: Repository; after: Repository }>
```

**方針**

- `loadSampleInput` と比較条件の解決を共用する。

#### 既存型の直接変更なし

**方針**

- `ReportDocument` と `ResolvedReport` は維持する。スクリプトのCLI引数だけが増える。

#### 新規関数 `buildSampleReport`

**引数・戻り値**

```text
buildSampleReport(name: string, document: ReportDocument, input: ReportInput, outputRoot: string): Promise<string>
```

**方針**

- `buildSampleReport(name, document, input, outputRoot)` は `resolveReport` と `writeReportSite` を呼び出し、生成先を返す。

#### 新規型 `SampleSelection`

**属性・型**

```text
SampleSelection = { kind: 'spec'; file: string } | { kind: 'templates'; names: readonly string[] }
```

**方針**

- 選択モードの判別が必要な場合は内部の `SampleSelection` で spec／templates を分ける。

**処理・互換性の補足** run-report.ts がカタログの現行雛形と既存のサンプル入力を選択し、目次を含め writeReportSite へ渡す。生成先を明示し、手作業で編集するステップを不要にする。

**変更コード案**

```ts
// docs/examples/report/scripts/run-report.ts の生成ループ
for (const name of sampleTemplateNames) {
    const document = REPORT_TEMPLATES[name]?.document();
    if (!document) throw new Error('Missing sample template: ' + name);
    const resolved = resolveReport(document, sampleInput);
    if (!resolved.ok) throw new Error(JSON.stringify(resolved.issues));
    const outputPath = path.join(outputRoot, name, 'index.html');
    await writeReportSite(resolved, outputPath);
}
// 各雛形の比較入力・パラメーターはサンプル側の設定から解決する。
```

**確認ケース** 新しい出力ディレクトリから実行し、目次から個別ページへ移動し、同じ条件で再生成できることを確認する。

<a id="implementation-detail-170"></a>

## 170. 大きいリポジトリのゴールデン

**解決したい問題** 実例由来の複雑なフローが、描画実装の変更で誤って分岐を失った場合に検出したい。

**現行コード** 既存のフローテストは既存サンプルを検証する。NPSP規模の複雑さを持つ固定断片の構造比較には別の入力が要る。

**主な修正先** [`test/processor/code-flow-providers.test.ts`](../../test/processor/code-flow-providers.test.ts)、[`test/processor/apex-providers.test.ts`](../../test/processor/apex-providers.test.ts)、[`test/processor/lwc-providers.test.ts`](../../test/processor/lwc-providers.test.ts)

**新規パス候補** `test/fixtures/npsp/`、`test/processor/npsp-flow-golden.test.ts`

**コード修正案** 利用できる小さな断片でノードと辺のスナップショットを作る。座標等は除外し、分岐種別・対応するノード・向きなど判定に必要な値は残す。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 既存の `getApexMethodFlows` と `getApexCallFlows` を新しい固定入力から呼ぶ。本体のフロー生成にテスト専用分岐は加えない。

#### 既存型の直接変更なし

**方針**

- `CodeFlow`／`CallSequence` は維持する。比較の対象だけをテスト側で選ぶ。

#### 新規関数 `flowSnapshot`

**引数・戻り値**

```text
flowSnapshot(flow: CodeFlow): FlowGolden
```

**方針**

- `flowSnapshot(flow)` はノード・辺を比較可能な形へ切り出す。
- シーケンスにも参加者と呼出し種別を抽出する関数を置く。

#### 新規関数 `sequenceSnapshot`

**引数・戻り値**

```text
sequenceSnapshot(sequence: CallSequence): SequenceGolden
```

**方針**

- シーケンスにも参加者と呼出し種別を抽出する関数を置く。

#### 新規型 `FlowGolden`

**属性・型**

```text
FlowGolden { nodes: Pick<CodeFlowNode, 'id' | 'kind' | 'label'>[]; edges: Pick<CodeFlowEdge, 'from' | 'to' | 'kind'>[] }
```

**方針**

- 必要なら `FlowGolden` に比較値を定義する。
- 既存型の Pick で足りる場合は新規型を追加しない。

#### 新規型 `SequenceGolden`

**属性・型**

```text
SequenceGolden = Pick<CallSequence, 'participants' | 'messages'>
```

**方針**

- 既存型の Pick で足りる場合は新規型を追加しない。

**処理・互換性の補足** 使用条件を確認できる小さなNPSP由来のfixtureで解析を固定し、ノードID、種別、辺の向きを並び順が安定する形で保存する。表示座標などの変動値は比較から外す。

**変更コード案**

```ts
// test/processor/npsp-flow-golden.test.ts
function flowSnapshot(flow: CodeFlow) {
    return {
        nodes: flow.nodes.map(({ id, kind, label }) => ({ id, kind, label })),
        edges: flow.edges.map(({ from, to, kind }) => ({ from, to, kind })),
    };
}
const actual = analyzeFixtureFlows(fixtureRoot).map(flowSnapshot);
assert.deepStrictEqual(actual, expectedFlows);
// シーケンスも参加者と呼出し元・先・メッセージ種別を比較する。
```

**確認ケース** ネストした処理と呼び出し図を再生成し、意図した制御変更だけが golden 差分になることを確認する。

<a id="implementation-detail-171"></a>

## 171. 書き込みのスレッドのテストを速くする

**解決したい問題** 書き込みワーカーのテスト反復実行で時間を使う区間を特定し、速度を改善したい。

**現行コード** ワーカー関連には起動・解析・書き込み・終了の複数段階がある。文書の26秒という総時間だけではどの段階か分からない。

**主な修正先** [`src/analyzer/worker/workerPool.ts`](../../src/analyzer/worker/workerPool.ts)、[`src/analyzer/worker/unitWorkerThread.ts`](../../src/analyzer/worker/unitWorkerThread.ts)、[`src/analyzer/unit/storeWriter.ts`](../../src/analyzer/unit/storeWriter.ts)、[`src/analyzer/unit/storeWriterThread.ts`](../../src/analyzer/unit/storeWriterThread.ts)、[`test/worker/worker.test.ts`](../../test/worker/worker.test.ts)

**コード修正案** worker.test.ts と storeWriter で区間を計測し、支配的な起動や待機処理を見直す。完了応答とエラーの確認を保ったまま、可能ならプロセス準備を共有する。

### 関数・型の変更一覧

#### 既存関数 `StoreWriterThread.write`

**引数・戻り値**

```text
StoreWriterThread.write(...args: WriteMessage['args']): void
```

**方針**

- `StoreWriterThread` の起動、write、flush、close とテスト側の待機を計測する。
- 支配的な遅延に応じて待機を応答同期へ変更する。

#### 既存関数 `StoreWriterThread.flush`

**引数・戻り値**

```text
StoreWriterThread.flush(): Promise<void>
```

**方針**

- `StoreWriterThread` の起動、write、flush、close とテスト側の待機を計測する。

#### 既存関数 `StoreWriterThread.close`

**引数・戻り値**

```text
StoreWriterThread.close(): Promise<void>
```

**方針**

- `StoreWriterThread` の起動、write、flush、close とテスト側の待機を計測する。

#### 既存型 `Reply`

**属性・型**

```text
Reply { id: number; error?: string }
```

**方針**

- 既存 `Reply` の id と error を優先して使い、起動通知が必要な場合だけスレッド内部メッセージを拡張する。

#### 新規関数 `createTestWriter`

**引数・戻り値**

```text
createTestWriter(): StoreWriterThread & { ready?: Promise<void> }
```

**方針**

- `createTestWriter()` はテスト用ワーカーを作り、明示的な完了待ちを提供する。
- 起動の共有はデータが隔離できるテストに限定する。

#### 新規型 `WriterReady`

**属性・型**

```text
WriterReady { type: 'ready' }
```

**方針**

- 既存型で通知できない場合は内部の `WriterReady` を追加する。
- 保存形式の型は変更しない。

**処理・互換性の補足** worker.test.ts の準備、ワーカー起動、書き込み完了、終了待ちを区間別に測る。固定の待ち時間があれば完了イベントに置き換え、起動共用は状態が独立する場合に限る。

**変更コード案**

```ts
// test/worker/worker.test.ts の起動・終了待ち
const startedAt = performance.now();
const worker = createTestWriter();
try {
    await worker.ready;
    worker.write(...sampleWriteArgs);
    await worker.flush();
    assert.deepStrictEqual(await readWrittenUnit(), sampleUnit);
} finally {
    await worker.close();
}
const elapsedMs = performance.now() - startedAt;
// ready は起動計測に必要な場合のみ追加する。書き込み完了は既存の flush() の応答を使う。
```

**確認ケース** 変更前後の時間と、連続実行時に書き込み完了・失敗・終了を検証できることを確認する。

<a id="implementation-detail-172"></a>

## 172. CI

**解決したい問題** Windows/LinuxのCIで、同じ依存バージョンを使って結果を比較したい。

**現行コード** ci.yml はOSマトリクスを持つが、lockfile を追跡していないため npm install を使う。監査はインストール時に無効化されている。

**主な修正先** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)、[`package.json`](../../package.json)、[`.gitignore`](../../.gitignore)

**新規パス候補** `package-lock.json`（追跡対象として追加）、`.github/dependabot.yml`

**コード修正案** .gitignore の lockfile 除外を見直して固定し、既存CIを npm ci に変更する。型・整形・テスト・ビルドを維持して監査と依存更新のジョブを追加する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- TypeScript関数の変更は不要。`.github/workflows/ci.yml` の既存インストールstepを npm ci にし、整形・型検査・テスト・ビルドを維持する。

#### 既存型の直接変更なし

**方針**

- TypeScript型の変更は不要。lockfileと設定YAMLは既存ツールの形式に従う。

#### 新規関数なし

**方針**

- 新規関数は不要。監査のstepと Dependabot 設定を追加する。

#### 新規型なし

**方針**

- アプリケーション型は追加しない。

**処理・互換性の補足** CIの既存ジョブでNodeと依存キャッシュの条件を固定し、lockfileから npm ci を行う。テストと監査の実行・失敗条件を明示し、Dependabotの更新対象を設定して初回実行を確認する。

**変更コード案**

```yaml
# .github/workflows/ci.yml の既存 steps に反映する案
- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: npm
- name: Install locked dependencies
  run: npm ci
- name: Typecheck and test
  run: |
    npm run typecheck
    npm test
- name: Audit dependencies
  run: npm audit
# package-lock.json の追跡から始め、既存の OS マトリクスと build を維持する。
```

**確認ケース** クリーン環境の依存インストールとテスト、監査結果、初回ジョブのログを確認する。

<a id="implementation-detail-173"></a>

## 173. 改行コード

**解決したい問題** WindowsとLinuxで同じファイルを変更すると、内容と無関係な改行の差分が多く出る問題を整えたい。

**現行コード** .gitattributes の規則を変えても既追跡データは再正規化されるまで揃わない。通常の差分に混ぜると内容レビューが難しい。

**主な修正先** [`.gitattributes`](../../.gitattributes)

**コード修正案** 追跡対象と text/eol を確認し、再正規化を独立して行う。行末空白を無視した差分とファイル種別の両方を確認する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 本体関数の変更は不要。`.gitattributes` と既追跡ファイルの差分を確認する。

#### 既存型の直接変更なし

**方針**

- 型の変更は不要。対象はGitの改行属性。

#### 新規関数なし

**方針**

- 新規関数は不要。`git add --renormalize .` の結果を差分で確認する。

#### 新規型なし

**方針**

- 新規型は不要。

**処理・互換性の補足** 対象の .gitattributes がバイナリや生成物も含め適切な改行規則かを確認する。再正規化結果は他の変更を分けた状態で確認し、バイナリや意図しない内容変更を切り分ける。

**変更コード案**

```powershell
# 実装時に改行だけの差分を確認する手順
git status --short
git check-attr text eol -- src/builder/reportBuilder.ts
git add --renormalize .
git diff --cached --stat
git diff --cached --ignore-space-at-eol
```

**確認ケース** 追跡ファイルの差分を改行無視でも確認し、除外すべき差分が混在していないことを確かめる。

<a id="implementation-detail-174"></a>

## 174. 一時ファイルを片付ける

**解決したい問題** 調査用の一時スクリプトが通常の機能・テストに見える状態を片づけたい。

**現行コード** tmp-lwc-baseline.ts と test/_count_nodes.tmp.ts が候補。引用やテストの入口で使われているかは削除前に確認が必要。

**主な修正先** [`tmp-lwc-baseline.ts`](../../tmp-lwc-baseline.ts)、[`test/_count_nodes.tmp.ts`](../../test/_count_nodes.tmp.ts)

**コード修正案** ファイル名と入口を追跡し、恒久処理への参照がないファイルを除く。必要な計測手順があれば既存のサンプル等へ移す。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 参照を検索して一時スクリプト内の処理を除けるか確認する。常用される処理が見つかった場合は恒久入口へ移す。

#### 既存型の直接変更なし

**方針**

- 既存の型は変更不要。スクリプト内からしか参照しない内部型はファイルとともに整理する。

#### 新規関数なし

**方針**

- 原則追加なし。恒久化が必要な操作は既存のサンプル入口を優先する。

#### 新規型なし

**方針**

- 新規型は不要。

**処理・互換性の補足** 一時ファイル名とその実行入口を検索し、package scripts、集約テスト、参照文書に残っていないことを確認する。参照が見つかれば現行の恒久手順へ移せるか確認する。

**変更コード案**

```powershell
# 参照の確認後、一時ファイルを削除対象にする
rg -n 'tmp-lwc-baseline|_count_nodes\.tmp' src test docs package.json .github
git ls-files -- tmp-lwc-baseline.ts test/_count_nodes.tmp.ts
npm run typecheck
npm test
```

**確認ケース** 削除候補の参照を再検索し、通常の型検査・テスト入口が成立することを確認する。

<a id="implementation-detail-175"></a>

## 175. テストの残り

**解決したい問題** 速度改善した保存比較や新しいproviderで、最適化や入力変更によって気づかず結果が変わるのを防ぎたい。

**現行コード** 今回の対象は S3 比較の全件照合との同等性、Apex Diff 全体のスキーマ、設定・YAML、新規provider。既存テストが検証する範囲を項目ごとに確認する。

**主な修正先** [`test/unit/store.test.ts`](../../test/unit/store.test.ts)、[`test/processor/apex-providers.test.ts`](../../test/processor/apex-providers.test.ts)、[`test/processor/report-providers.test.ts`](../../test/processor/report-providers.test.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`test/report/document-schema.test.ts`](../../test/report/document-schema.test.ts)

**新規パス候補** `test/unit/config.test.ts`、`test/unit/store-s3.test.ts`

**コード修正案** 保存比較は同じ入力を両経路で実行する。Apex Diff は代表する前後の全型、設定とYAMLは不正例、新providerは比較の有無と出力スキーマを検証する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 本体の `makeIdUnitDiffs` を同一オブジェクトと同内容の別オブジェクトで呼び、早期終了する `makeIdUnitDiff` と詳細比較の経路をそれぞれ通す。Apex Diff・設定・YAML・追加providerは各機能の通常入口をテストする。

#### 既存型の直接変更なし

**方針**

- 本体の `IdUnitDiff` は維持する。未変更の content は省略可能なので、比較対象を公開上意味のある id・status・dataType・resolvedError 等に限定する。Apex Diff は既存型と対応するZodスキーマを揃える。

#### 新規関数 `projectComparableUnitDiff`

**引数・戻り値**

```text
projectComparableUnitDiff<R extends IdParseResult, Content>(diff: IdUnitDiff<R, Content>): IdUnitDiff<R, Content>
```

**方針**

- テスト用の `projectComparableUnitDiff(diff)` が unchanged の任意の content を比較から除く。
- 別の公開関数や、比較を強制する本体フラグは追加不要。

#### 新規型なし

**方針**

- 新規公開型は不要。サンプルと期待値は `IdUnitDiff` と各 provider の既存出力型から導く。

**処理・互換性の補足** S3では同じ比較入力を省略あり・なし両経路に通し、Apex Diff は代表構造をZodで検証する。設定・YAMLは成功と不正例、新providerは空入力、比較要否、出力スキーマを優先して確認する。

**変更コード案**

```ts
// test/unit/store-s3.test.ts + 既存の差分検証
const optimized = makeIdUnitDiffs([parsedUnit], [parsedUnit], contentMaker);
const full = makeIdUnitDiffs([parsedUnit], [structuredClone(parsedUnit)], contentMaker);
assert.deepStrictEqual(
    optimized.map(projectComparableUnitDiff),
    full.map(projectComparableUnitDiff),
);
for (const change of apexChanges) {
    assert.equal(ApexDiffSchema.safeParse(change).success, true);
}
// projectComparableUnitDiff は unchanged の任意の content だけを比較から除く。
```

**確認ケース** 既存テストのカバレッジと照合し、各ケースが対象の回帰を一つずつ検出できることを確認する。

<a id="implementation-detail-180"></a>

## 180. 実際の組織での洗い出し

**解決したい問題** NPSP等で発生した未対応や誤検出を、別の実装者が同じ入力で再現できるようにしたい。

**現行コード** 分析の結果は単位の読取結果や指摘に分散する。リビジョン、種別、位置をまとめた調査用の出力が必要。

**主な修正先** [`src/analyzer/processor/Apex/`](../../src/analyzer/processor/Apex/)、[`src/analyzer/processor/Lwc/`](../../src/analyzer/processor/Lwc/)、[`src/analyzer/processor/Metadata/`](../../src/analyzer/processor/Metadata/)、[`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)、[`docs/examples/`](../../docs/examples/)

**新規パス候補** `docs/examples/report/scripts/check-repository.ts`

**コード修正案** 既存のRepositoryローダーから未対応・スキップ・指摘を集約する。入力リビジョンと観測結果を安定順で保存し、誤検出を再現する最小例を残す。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- `check-repository.ts` から既存の Repository ロードと各診断を呼ぶ。本体側は再現例で検出された問題を個別に修正する。

#### 既存型の直接変更なし

**方針**

- `Repository` と既存解析結果の型は維持する。調査用出力は別スキーマで扱う。

#### 新規関数 `inspectRepository`

**引数・戻り値**

```text
inspectRepository(repository: Repository, revision: string): InspectionReport
```

**方針**

- `inspectRepository(repository, revision)` は未対応・スキップ・警告を集計し、できるだけ単位IDと位置に結び付ける。

#### 新規型 `InspectionRow`

**属性・型**

```text
InspectionRow { unitId: string; kind: 'unhandled' | 'skipped' | 'finding'; sourceKeys?: ConvertKeys; detail: string }
```

**方針**

- `InspectionRow` は単位、分類、任意の位置、説明。

#### 新規型 `InspectionReport`

**属性・型**

```text
InspectionReport { revision: string; counts: Record<InspectionRow['kind'], number>; rows: InspectionRow[] }
```

**方針**

- `InspectionReport` はリビジョン、分類別件数、行。

**処理・互換性の補足** 実リポジトリの入力リビジョンを記録し、未対応単位、skippedElements、参照の警告を種別と根拠位置で集計する。誤検出を確認できた事例は必要な要素だけに縮めて残す。

**変更コード案**

```ts
// docs/examples/report/scripts/check-repository.ts
type InspectionRow = {
    unitId: string;
    kind: 'unhandled' | 'skipped' | 'finding';
    sourceKeys?: ConvertKeys;
    detail: string;
};
type InspectionReport = { revision: string; counts: Record<InspectionRow['kind'], number>; rows: InspectionRow[] };
// Repository 取得後に単位結果と指摘を行化し、revision と安定順の一覧を出力する。
```

**確認ケース** 同じリビジョンで集計を再現でき、各指摘を元の単位と位置までたどれることを確認する。

<a id="implementation-detail-181"></a>

## 181. サンプルのスクリプトを 1 つにまとめる

**解決したい問題** Apex、LWC、メタデータのサンプルを同じ手順で実行して、出力場所を一箇所で確認したい。

**現行コード** docs/examples 配下に種別ごとの run-parse／run-diff があり、共通の paths.ts を使う箇所と個別に制御する箇所がある。

**主な修正先** [`docs/examples/apex/scripts/`](../../docs/examples/apex/scripts/)、[`docs/examples/lwc/scripts/`](../../docs/examples/lwc/scripts/)、[`docs/examples/metadata/scripts/`](../../docs/examples/metadata/scripts/)、[`docs/examples/paths.ts`](../../docs/examples/paths.ts)、[`docs/examples/README.md`](../../docs/examples/README.md)

**新規パス候補** `docs/examples/run.ts`

**コード修正案** 共通ランナーが種別・処理・パスを解決し、既存の変換入口を呼ぶ。従来のスクリプトに利用者がいる場合は共通ランナーへ委譲する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 種別ごとの run-parse／run-diff を共通ランナーへ接続する。`docs/examples/paths.ts` のパス解決を利用する。

#### 既存型の直接変更なし

**方針**

- 既存サンプルの出力型は維持する。ランナーの入力を種別・操作・パスで表す。

#### 新規関数 `runExample`

**引数・戻り値**

```text
runExample(name: ExampleName, action: ExampleAction, paths: ExamplePaths): Promise<void>
```

**方針**

- `runExample(name, action, paths)` は既存のパーサー／差分入口を選んで実行する。
- 従来CLIは必要に応じて委譲する。

#### 新規型 `ExampleName`

**属性・型**

```text
ExampleName = 'apex' | 'lwc' | 'metadata'
```

**方針**

- `ExampleName` は apex/lwc/metadata、`ExampleAction` は parse/diff、`ExampleRunner` はパスを受ける非同期実行関数。

#### 新規型 `ExampleAction`

**属性・型**

```text
ExampleAction = 'parse' | 'diff'
```

**方針**

- `ExampleName` は apex/lwc/metadata、`ExampleAction` は parse/diff、`ExampleRunner` はパスを受ける非同期実行関数。

#### 新規型 `ExampleRunner`

**属性・型**

```text
ExampleRunner = (paths: ExamplePaths) => Promise<void>
```

**方針**

- `ExampleName` は apex/lwc/metadata、`ExampleAction` は parse/diff、`ExampleRunner` はパスを受ける非同期実行関数。

**処理・互換性の補足** 既存の sample paths と出力規則を共通ランナーに寄せ、解析・差分の実行だけを処理種別で分ける。従来のサンプルスクリプトで使う引数・出力が必要な場合は呼び出しに接続する。

**変更コード案**

```ts
// docs/examples/run.ts
type ExampleName = 'apex' | 'lwc' | 'metadata';
type ExampleAction = 'parse' | 'diff';
type ExampleRunner = (paths: ExamplePaths) => Promise<void>;
const runners: Record<ExampleName, Record<ExampleAction, ExampleRunner>> = {
    apex: { parse: parseApexSample, diff: diffApexSample },
    lwc: { parse: parseLwcSample, diff: diffLwcSample },
    metadata: { parse: parseMetadataSample, diff: diffMetadataSample },
};
// docs/examples/paths.ts で解決した共通入力と出力先を選択済みランナーへ渡す。
```

**確認ケース** Apex、LWC、メタデータから少なくとも一つずつ実行し、旧出力と比較する。

<a id="implementation-detail-182"></a>

## 182. 網羅の表を登録表から作る

**解決したい問題** providerを追加したとき、対応範囲の文書だけ更新し忘れるのを防ぎたい。

**現行コード** docs/catalog/generate.ts はカタログ・スキーマ・雛形を生成する。todoの網羅表は登録情報と別に管理される。

**主な修正先** [`docs/catalog/generate.ts`](../../docs/catalog/generate.ts)、[`docs/todo.md`](../../docs/todo.md)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/unit/unitType.ts`](../../src/analyzer/unit/unitType.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/report/templateList.ts`](../../src/report/templateList.ts)

**新規パス候補** `docs/catalog/coverage.md`

**コード修正案** 単位種別、provider定義、部品バインディングから対応表を安定順に生成する。自動で決められない対応関係だけを登録上の明示属性として管理する。

### 関数・型の変更一覧

#### 既存関数 `catalogFiles`

**引数・戻り値**

```text
catalogFiles(): Record<string, string>
```

**方針**

- `catalogFiles` に coverage.md を生成対象として追加し、既存の registry とデータバインディングを読む。
- 手動の網羅表から新しい生成物へリンクする。

#### 既存型 `ProviderDefinition`

**属性・型**

```text
ProviderDefinition { coverageUnitTypes?: readonly string[] }
```

**方針**

- `ProviderDefinition` へ暗黙に推測できない対象単位を任意で付ける案。
- 既存のプロバイダ入力・出力スキーマは維持する。

#### 新規関数 `collectCoverage`

**引数・戻り値**

```text
collectCoverage(unitTypes: readonly AnyUnitType[], providers: Readonly<Record<string, ProviderDefinition>>, bindings: typeof REPORT_DATA_BINDINGS): CoverageEntry[]
```

**方針**

- `collectCoverage(unitTypes, providers, bindings)` が関係を安定順で列挙し、`renderCoverageMarkdown(entries)` が表を生成する。

#### 新規関数 `renderCoverageMarkdown`

**引数・戻り値**

```text
renderCoverageMarkdown(entries: readonly CoverageEntry[]): string
```

**方針**

- `collectCoverage(unitTypes, providers, bindings)` が関係を安定順で列挙し、`renderCoverageMarkdown(entries)` が表を生成する。

#### 新規型 `CoverageEntry`

**属性・型**

```text
CoverageEntry { unitType: string; providers: readonly string[]; components: readonly string[] }
```

**方針**

- `CoverageEntry` は unitType、provider名配列、対応する部品名配列。

**処理・互換性の補足** 単位種別、provider定義、部品のデータバインディングから対応行を作る。登録から推論できない網羅状態は明示的な定義に置き、安定順で coverage.md を生成する。

**変更コード案**

```ts
// docs/catalog/generate.ts
type CoverageEntry = {
    unitType: string;
    providers: readonly string[];
    components: readonly string[];
};
const coverage = collectCoverage(unitTypeDefinitions, PROVIDER_DEFINITIONS, REPORT_DATA_BINDINGS)
    .sort((a: CoverageEntry, b: CoverageEntry) => a.unitType.localeCompare(b.unitType));
await writeFile(coveragePath, renderCoverageMarkdown(coverage));
// provider と単位種別の対応が定義から取れない部分はカタログ側の明示情報で補う。
```

**確認ケース** 同じ登録情報で再生成して差分が出ないことと、ダミーの登録追加で該当行が更新されることを確認する。
