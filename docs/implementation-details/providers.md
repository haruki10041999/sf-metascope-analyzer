# 2. provider（`src/analyzer/report`）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-52"></a>

## 52. 呼び出しグラフとクラス間の依存

**解決したい問題** OrderService.run → InvoiceService.create の関係を、メソッド単位の図とクラス単位の図の両方で見たい。

**現行コード** apexCallFlow の索引はシーケンス描画向けで、provider の出力は起点からたどったメッセージ。グラフ用の宣言ノードと辺は公開されていない。

**主な修正先** [`src/analyzer/report/apexCallFlow.ts`](../../src/analyzer/report/apexCallFlow.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)

**新規パス候補** `src/analyzer/report/apexCallGraph.ts`

**コード修正案** 宣言IDと呼出箇所を持つ辺を共有索引から作る。メソッド図では辺を直接使い、クラス図では所有クラスの組で集約して根拠箇所を持たせる。両方を registry と schemas に追加する。

### 関数・型の変更一覧

#### 既存関数 `getApexCallFlows`

**引数・戻り値**

```text
getApexCallFlows(input: SnapshotInput, filter?: ApexCallFlowFilter): CallSequence[]
```

**方針**

- `getApexCallFlows` は宣言・呼出しを共有索引から読む形へ移行する。
- `PROVIDER_DEFINITIONS` にメソッド図とクラス図を登録する。

#### 既存型の直接変更なし

**方針**

- 既存 `CallSequence` は維持する。provider 名の union は registry から新しいキーを導出する。

#### 新規関数 `graphEdges`

**引数・戻り値**

```text
graphEdges(callerId: string, call: ApexCallInfo): ApexCallEdge[]
```

**方針**

- `graphEdges(callerId, call)` が解決結果から辺を作る。

#### 新規関数 `getApexCallGraph`

**引数・戻り値**

```text
getApexCallGraph(input: ReportInput, args: ApexCallGraphArgs): ApexCallGraph
```

**方針**

- `getApexCallGraph(input, args)` と `getApexClassDependencies(input, args)` が同じ辺を別の粒度で返す。

#### 新規関数 `getApexClassDependencies`

**引数・戻り値**

```text
getApexClassDependencies(input: ReportInput, args: ApexCallGraphArgs): ApexClassDependencyRow[]
```

**方針**

- `getApexCallGraph(input, args)` と `getApexClassDependencies(input, args)` が同じ辺を別の粒度で返す。

#### 新規型 `ApexCallEdge`

**属性・型**

```text
ApexCallEdge { from: string; to: string; sourceKeys: ConvertKeys; conditional: boolean }
```

**方針**

- `ApexCallEdge` は from・to・sourceKeys・候補フラグ、`ApexCallGraph` は宣言ノードと辺。
- クラス集約行はクラスIDの組と利用箇所を持つ。

#### 新規型 `ApexCallGraph`

**属性・型**

```text
ApexCallGraph { nodes: readonly ApexMethodSymbol[]; edges: readonly ApexCallEdge[] }
```

**方針**

- `ApexCallEdge` は from・to・sourceKeys・候補フラグ、`ApexCallGraph` は宣言ノードと辺。

#### 新規型 `ApexCallGraphArgs`

**属性・型**

```text
ApexCallGraphArgs { classes?: string[]; depth?: number }
```

**方針**

- クラス集約行はクラスIDの組と利用箇所を持つ。

#### 新規型 `ApexClassDependencyRow`

**属性・型**

```text
ApexClassDependencyRow { from: string; to: string; sites: readonly ConvertKeys[] }
```

**方針**

- クラス集約行はクラスIDの組と利用箇所を持つ。

**処理・互換性の補足** メソッドグラフは宣言IDをノード、呼出箇所を根拠とする有向辺にする。クラス依存は同じ辺を所有クラスで集約し、回数・位置を残す。循環と多候補は共有索引からそのまま得る。

**変更コード案**

```ts
// report/apexCallGraph.ts
type ApexCallEdge = { from: string; to: string; sourceKeys: ConvertKeys; conditional: boolean };
function graphEdges(callerId: string, call: AnalyzedApexCall): ApexCallEdge[] {
    const resolution = call.resolution;
    if (!resolution || resolution.kind === 'unresolved') return [];
    const ids = resolution.kind === 'exact' ? [resolution.targetId] : resolution.targetIds;
    return ids.map((to) => ({
        from: callerId, to, sourceKeys: call.sourceKeys,
        conditional: resolution.kind === 'candidates',
    }));
}
// クラス集約は同じ辺を owner に写し、呼出箇所のリストを保持する。
```

**確認ケース** 再帰、複数箇所から同一メソッドへの呼び出し、複数クラス候補で両providerの件数が整合することを確認する。

<a id="implementation-detail-53"></a>

## 53. LWC の親子関係の図

**解決したい問題** c-account-list の配下に c-account-row と c-empty-state がある構成を、イベントの有無にかかわらず確認したい。

**現行コード** getLwcEventFlow は bundle 内のイベント・子を図の用途で組み立てる。子の構造だけを起点からたどる provider がない。

**主な修正先** [`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/lwcEventFlow.ts`](../../src/analyzer/report/lwcEventFlow.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)

**新規パス候補** `src/analyzer/report/lwcComponentTree.ts`

**コード修正案** flowOfBundle 内の親子タグ抽出を共有化し、componentTree で BFS する。訪問済みノードと観測済みの辺は別管理にして、同じ子を複数親が使う場合と循環を表す。

### 関数・型の変更一覧

#### 既存関数 `flowOfBundle`

**引数・戻り値**

```text
flowOfBundle(bundle: Bundle): BundleFlow
```

**方針**

- `flowOfBundle` の子コンポーネント抽出をレポート間で共用できる位置へ移す。

#### 既存関数 `getLwcEventFlow`

**引数・戻り値**

```text
getLwcEventFlow(input: SnapshotInput, filter?: LwcEventFlowFilter): EventFlow
```

**方針**

- `getLwcEventFlow` の出力は既存のまま保つ。

#### 既存型 `BundleFlow`

**属性・型**

```text
BundleFlow { componentEdges: readonly ComponentEdge[] }
```

**方針**

- `BundleFlow` は共有処理の親子辺を使う。
- イベントフローの公開型の変更は不要。

#### 新規関数 `componentTree`

**引数・戻り値**

```text
componentTree(root: string, depth: number, byParent: ReadonlyMap<string, ComponentEdge[]>): ComponentGraph
```

**方針**

- `componentTree(root, depth, byParent)` は段ごとに探索し、訪れたコンポーネントと観測した辺を返す。

#### 新規関数 `getLwcComponentTree`

**引数・戻り値**

```text
getLwcComponentTree(input: SnapshotInput, args: ComponentTreeArgs): ComponentGraph
```

**方針**

- `getLwcComponentTree(input, args)` がprovider入口。

#### 新規型 `ComponentEdge`

**属性・型**

```text
ComponentEdge { parent: string; child: string; sourceKeys: ConvertKeys }
```

**方針**

- `ComponentEdge` は親・子・位置。
- 引数スキーマは任意の起点・深さを受ける。

#### 新規型 `ComponentGraph`

**属性・型**

```text
ComponentGraph { nodes: string[]; edges: ComponentEdge[] }
```

**方針**

- `ComponentGraph` はノードと親子辺。

#### 新規型 `ComponentTreeArgs`

**属性・型**

```text
ComponentTreeArgs { root: string; depth?: number }
```

**方針**

- 引数スキーマは任意の起点・深さを受ける。

**処理・互換性の補足** 既存の親子抽出から親ID、子ID、タグ位置を取り出し、起点から深さを制限して探索する。訪問済みノードと出力済みの辺を分けて管理し、複数親と循環を保持する。

**変更コード案**

```ts
// report/lwcComponentTree.ts
type ComponentEdge = { parent: string; child: string; sourceKeys: ConvertKeys };
type ComponentGraph = { nodes: string[]; edges: ComponentEdge[] };
function componentTree(root: string, depth: number, byParent: ReadonlyMap<string, ComponentEdge[]>): ComponentGraph {
    const visited = new Set<string>([root]);
    const edges: ComponentEdge[] = [];
    let layer = [root];
    for (let level = 0; level < depth && layer.length; level++) {
        const next: string[] = [];
        for (const edge of layer.flatMap((parent) => byParent.get(parent) ?? [])) {
            edges.push(edge);
            if (!visited.has(edge.child)) { visited.add(edge.child); next.push(edge.child); }
        }
        layer = next;
    }
    return { nodes: [...visited], edges };
}
```

**確認ケース** 子を共有する2親、循環、認識できないカスタムタグを入力に使う。

<a id="implementation-detail-54"></a>

## 54. 項目 × 使う場所の行列

**解決したい問題** Invoice__c.Amount__c を使う Apex、LWC、Flow、レイアウト、数式、権限を一箇所で確認したい。

**現行コード** crossRef.references は依存先の使用箇所を返すが、項目を行、利用種別を列とした表示向け集計はない。

**主な修正先** [`src/analyzer/report/crossRef.ts`](../../src/analyzer/report/crossRef.ts)、[`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/dependency/units.ts`](../../src/analyzer/processor/dependency/units.ts)

**新規パス候補** `src/analyzer/report/fieldUsage.ts`

**コード修正案** 依存辺と項目別の読取結果から object・field・sourceKind・unitId・sourceKeys に正規化する。同位置の二重報告を抑え、LWC版は元データをLWCに絞って同じ集計へ渡す。

### 関数・型の変更一覧

#### 既存関数 `getReferenceUsages`

**引数・戻り値**

```text
getReferenceUsages(input: ReportInput, args?: { refTypes?: string[] }): ReferenceUsageRow[]
```

**方針**

- `getReferenceUsages` と同じ依存データを使い、既存の参照抽出側には行生成に足りない出所だけ補う。
- registry に全体版とLWC版を登録する。

#### 既存型の直接変更なし

**方針**

- `ReferenceUsageRow` は維持する。既存 `Matrix<V>` を使う場合は利用箇所の型を V として指定する。

#### 新規関数 `getFieldUsage`

**引数・戻り値**

```text
getFieldUsage(input: ReportInput, filter: FieldUsageFilter): Matrix<FieldUsageSite[]>
```

**方針**

- `getFieldUsage(input, filter)` は項目名と利用元で集計する。

#### 新規関数 `fieldUsageKey`

**引数・戻り値**

```text
fieldUsageKey(site: FieldUsageSite): string
```

**方針**

- `fieldUsageKey(site)` はオブジェクトと項目の組をキーにし、LWC版は filter を指定して呼ぶ。

#### 新規型 `FieldUsageSite`

**属性・型**

```text
FieldUsageSite { object: string; field: string; sourceKind: 'apex' | 'lwc' | 'flow' | 'layout' | 'formula' | 'permission'; unitId: string; sourceKeys?: ConvertKeys }
```

**方針**

- `FieldUsageSite` は object・field・sourceKind・unitId・sourceKeys。
- 必要に応じて単一セル内の利用箇所配列を行列型へ渡す。

#### 新規型 `FieldUsageFilter`

**属性・型**

```text
FieldUsageFilter { sourceKind?: FieldUsageSite['sourceKind']; objects?: string[] }
```

**方針**

- 必要に応じて単一セル内の利用箇所配列を行列型へ渡す。

**処理・互換性の補足** 各解析元を objectApiName、fieldApiName、sourceKind、sourceId、sourceKeys の候補行に変換し、項目へ束ねる。LWC版は同じ集計の入力を LWC に絞る。

**変更コード案**

```ts
// report/fieldUsage.ts
type FieldUsageSite = {
    object: string;
    field: string;
    sourceKind: 'apex' | 'lwc' | 'flow' | 'layout' | 'formula' | 'permission';
    unitId: string;
    sourceKeys?: ConvertKeys;
};
function fieldUsageKey(site: FieldUsageSite): string {
    return JSON.stringify([site.object, site.field]);
}
// LWC版は同一の集約処理に sourceKind === 'lwc' の集合を渡す。
```

**確認ケース** 複数種別で使う項目、異なるオブジェクトの同名項目、同一箇所の重複を確認する。

<a id="implementation-detail-55"></a>

## 55. メトリクス

**解決したい問題** 同じ run() メソッドについて、文やクエリを一つの箱にまとめてもメトリクスには元の個数を出したい。

**現行コード** buildCodeFlow は連続する処理文を箱へまとめるため、箱の個数をメソッドの文数とみなせない。

**主な修正先** [`src/analyzer/report/apexFlow.ts`](../../src/analyzer/report/apexFlow.ts)、[`src/analyzer/report/codeFlow.ts`](../../src/analyzer/report/codeFlow.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Apex/walker.ts`](../../src/analyzer/processor/Apex/walker.ts)

**新規パス候補** `src/analyzer/report/apexMetrics.ts`

**コード修正案** walker の元文を走査して文と分岐を記録する。ループ・条件・例外などの数え方を一覧の定義に書き、SOQL/DML と呼出しの数は analyzeApexUnit の解析結果から署名別に集める。

### 関数・型の変更一覧

#### 既存関数 `analyzeApexUnit`

**引数・戻り値**

```text
analyzeApexUnit(unit: ApexUnitParseResult): ApexUnitInfo
```

**方針**

- `walkApexParseResult` の文・分岐の走査と `analyzeApexUnit` の SOQL/DML を使う。
- `buildCodeFlow` は表示専用として現在の集約を維持する。

#### 既存型 `ApexWalkContext`

**属性・型**

```text
ApexWalkContext { memberId?: string; nestingDepth: number }
```

**方針**

- `ApexWalkContext` はメンバーの署名IDを利用できるよう16と連携する。
- 公開の `CodeFlow` は変更不要。

#### 新規関数 `getApexMetrics`

**引数・戻り値**

```text
getApexMetrics(input: SnapshotInput, filter?: ApexFilter): ApexMetricsRow[]
```

**方針**

- `getApexMetrics(input, filter)` がメソッドの行を生成する。

#### 新規関数 `countComplexity`

**引数・戻り値**

```text
countComplexity(decisionPoints: readonly DecisionPoint[]): number
```

**方針**

- `countComplexity(decisionPoints)` が分岐による追加経路を加算する。

#### 新規型 `ApexMetricsRow`

**属性・型**

```text
ApexMetricsRow { owner: string; signature: string; statements: number; cyclomaticComplexity: number; maxNesting: number; soql: number; dml: number; calls: number }
```

**方針**

- `ApexMetricsRow` は owner、署名、文数、複雑度、最大ネスト、SOQL・DML・呼出し件数。

#### 新規型 `DecisionPoint`

**属性・型**

```text
DecisionPoint { sourceKeys?: ConvertKeys; additionalPaths: number }
```

**方針**

- `DecisionPoint` は文の位置と追加経路数を表す内部型。

**処理・互換性の補足** 文を走査した時点でノード種別を数え、分岐点を加えた基本複雑度と最大ネストをメソッド署名ごとに記録する。分岐の数え方をカタログに明示し、SOQL/DML/呼出しは解析結果から集計する。

**変更コード案**

```ts
// report/apexMetrics.ts
type ApexMetricsRow = {
    owner: string;
    signature: string;
    statements: number;
    cyclomaticComplexity: number;
    maxNesting: number;
    soql: number;
    dml: number;
    calls: number;
};
function countComplexity(decisionPoints: readonly DecisionPoint[]): number {
    return 1 + decisionPoints.reduce((total, point) => total + point.additionalPaths, 0);
}
// 判定点は walker の文種別から集め、描画済みの箱は集計に使わない。
```

**確認ケース** 空メソッド、複数分岐、ネスト、フロー折りたたみの有無で指標を比較する。

<a id="implementation-detail-56"></a>

## 56. LWC の Apex の呼び出しの一覧

**解決したい問題** 同一 LWC が getAccounts を wire とクリック時の命令呼出しで使うことを一覧で区別したい。

**現行コード** LWC の import、wire、呼出しの分析結果は別の出力で使われる。provider で束ねた利用行がない。

**主な修正先** [`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)、[`src/analyzer/processor/Lwc/calls.ts`](../../src/analyzer/processor/Lwc/calls.ts)

**コード修正案** Apex import のローカル名を binding ID で索引化し、wire と命令呼出しを突き合わせる。コンポーネント、正規メソッド名、方式、ソース位置の行を lwc.ts から返す。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- LWC の import と call 分析から既存の束縛情報を取り出し、registry に新しい行データを登録する。既存LWCの読み込み入口は維持する。

#### 既存型 `LwcCallInfo`

**属性・型**

```text
LwcCallInfo { bindingId?: string; sourceKeys: ConvertKeys }
```

**方針**

- `LwcCallInfo` は現在の呼出し位置を再利用し、必要なら import を示す束縛IDだけ任意で補う。

#### 新規関数 `getLwcApexCalls`

**引数・戻り値**

```text
getLwcApexCalls(input: SnapshotInput, filter?: LwcFilter): LwcApexCallRow[]
```

**方針**

- `getLwcApexCalls(input, filter)` は対象bundleを選び、`toApexCallRow(site, imports)` がApex importと一致した箇所だけ行を返す。

#### 新規関数 `toApexCallRow`

**引数・戻り値**

```text
toApexCallRow(site: LwcCallSite, imports: ReadonlyMap<string, ApexImport>): LwcApexCallRow[]
```

**方針**

- `getLwcApexCalls(input, filter)` は対象bundleを選び、`toApexCallRow(site, imports)` がApex importと一致した箇所だけ行を返す。

#### 新規型 `LwcApexCallRow`

**属性・型**

```text
LwcApexCallRow { component: string; apexClass: string; apexMethod: string; via: 'wire' | 'imperative'; sourceKeys: ConvertKeys }
```

**方針**

- `LwcApexCallRow` は component・Apexクラス／メソッド・wire/imperative・位置。

#### 新規型 `LwcCallSite`

**属性・型**

```text
LwcCallSite { bindingId: string; component: string; via: 'wire' | 'imperative'; sourceKeys: ConvertKeys }
```

**方針**

- `LwcCallSite` は詳細解析用の束縛IDを持つ。

#### 新規型 `ApexImport`

**属性・型**

```text
ApexImport { apexClass: string; apexMethod: string }
```

**方針**

- `LwcApexCallRow` は component・Apexクラス／メソッド・wire/imperative・位置。

**処理・互換性の補足** Apex import の別名から正規のクラス・メソッドを引く。wire のデコレーターと calls.ts の命令呼出しから、呼び出し方式、所有コンポーネント、位置を行へ出す。

**変更コード案**

```ts
// report/lwc.ts
type LwcApexCallRow = {
    component: string;
    apexClass: string;
    apexMethod: string;
    via: 'wire' | 'imperative';
    sourceKeys: ConvertKeys;
};
function toApexCallRow(site: LwcCallSite, imports: ReadonlyMap<string, ApexImport>): LwcApexCallRow[] {
    const imported = imports.get(site.bindingId);
    return imported ? [{ ...imported, component: site.component, via: site.via, sourceKeys: site.sourceKeys }] : [];
}
```

**確認ケース** 同じApexを wire と命令の両方で呼ぶ例と、同名のローカル関数を含む例を確認する。

<a id="implementation-detail-57"></a>

## 57. 自動化の中身

**解決したい問題** Case の自動応答ルールについて、どの順序でどの条件とアクションを評価するかを専用の表で読みたい。

**現行コード** getAutomationByObject は対象オブジェクト別の概要が中心で、各種ルールの条件とアクションを一定の契約で取得できない。

**主な修正先** [`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Metadata/automation.ts`](../../src/analyzer/processor/Metadata/automation.ts)、[`src/analyzer/types/metadata/recordTypes.ts`](../../src/analyzer/types/metadata/recordTypes.ts)

**新規パス候補** `src/analyzer/report/automation.ts`

**コード修正案** 各 RecordSpec の行から種別、論理ID、条件、アクション、順序を保持して専用行へ投影する。種別特有の値は共通外枠と種別別の条件型で扱う。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 現行 `getAutomationByObject` は概要のまま使う。既存の RecordSpec と automation の読取処理を、詳細providerが必要とする節まで使えるようにする。

#### 既存型の直接変更なし

**方針**

- `AutomationRow` の既存列は維持する。既存 RecordSpec で欠ける属性だけ、該当するルール仕様に追加する。

#### 新規関数 `getAutomationRules`

**引数・戻り値**

```text
getAutomationRules(input: SnapshotInput, filter: AutomationRuleFilter): AutomationRuleRow[]
```

**方針**

- `getAutomationRules(input, filter)` が対象種別と単位を選び、`toAutomationRuleRow(unit, rule)` が条件とアクションを順序付きで返す。

#### 新規関数 `toAutomationRuleRow`

**引数・戻り値**

```text
toAutomationRuleRow(unit: string, rule: ParsedAutomationRule): AutomationRuleRow
```

**方針**

- `getAutomationRules(input, filter)` が対象種別と単位を選び、`toAutomationRuleRow(unit, rule)` が条件とアクションを順序付きで返す。

#### 新規型 `AutomationRuleRow`

**属性・型**

```text
AutomationRuleRow { unitId: string; rule: string; kind: 'approval' | 'assignment' | 'autoResponse' | 'escalation' | 'duplicate' | 'matching'; order: number; conditions: AutomationCondition[]; actions: AutomationAction[]; sourceKeys?: ConvertKeys }
```

**方針**

- `AutomationRuleRowSchema` から行型を導出する。

#### 新規型 `AutomationRuleFilter`

**属性・型**

```text
AutomationRuleFilter { kinds?: AutomationRuleRow['kind'][]; units?: string[] }
```

**方針**

- `AutomationRuleRowSchema` から行型を導出する。

#### 新規型 `AutomationCondition`

**属性・型**

```text
AutomationCondition { field: string; operator: string; value: unknown; sourceKeys?: ConvertKeys }
```

**方針**

- `AutomationConditionSchema` と `AutomationActionSchema` はルール種類に応じた値と位置を保持する。

#### 新規型 `AutomationAction`

**属性・型**

```text
AutomationAction { kind: string; target?: string; sourceKeys?: ConvertKeys }
```

**方針**

- `AutomationConditionSchema` と `AutomationActionSchema` はルール種類に応じた値と位置を保持する。

**処理・互換性の補足** ルールごとの識別子・評価順・条件・アクションを取り出し、種別別スキーマまたは共通の外枠に写す。条件を満たさない場合の分岐や空アクションも保持する。

**変更コード案**

```ts
// report/automation.ts
const AutomationRuleRowSchema = z.object({
    unitId: z.string(),
    rule: z.string(),
    kind: z.enum(['approval', 'assignment', 'autoResponse', 'escalation', 'duplicate', 'matching']),
    order: z.number().int().nonnegative(),
    conditions: z.array(AutomationConditionSchema),
    actions: z.array(AutomationActionSchema),
    sourceKeys: ConvertKeysSchema.optional(),
});
// 条件・アクションの型は RecordSpec が持つ値を種別別に写す。
```

**確認ケース** 各種別の条件付きアクション、複数順序、条件なしの入力で行が元定義に対応することを確認する。

<a id="implementation-detail-58"></a>

## 58. 権限の残り

**解決したい問題** プロファイルのレコードタイプ割当と、権限グループの明細やミュートを同じレビューから確認したい。

**現行コード** permission.ts の既存providerはオブジェクト・項目・Apexアクセスと実効権限が中心。割当や表示設定の出所を問う一覧には dedicated な行が必要。

**主な修正先** [`src/analyzer/report/permission.ts`](../../src/analyzer/report/permission.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Metadata/permissionAnalysis.ts`](../../src/analyzer/processor/Metadata/permissionAnalysis.ts)、[`src/analyzer/types/metadata/permission.ts`](../../src/analyzer/types/metadata/permission.ts)、[`src/analyzer/types/metadata/recordTypes.ts`](../../src/analyzer/types/metadata/recordTypes.ts)

**コード修正案** permissionAnalysis が宣言値の保持者と対象、設定値を保持する。provider はタブ等を型付きで返し、実効アクセスの既存列と混同しないよう設定元を行に付ける。

### 関数・型の変更一覧

#### 既存関数 `analyzePermissions`

**引数・戻り値**

```text
analyzePermissions(inputs: PermissionInputs, context?: MetadataContext): PermissionAnalysis
```

**方針**

- `analyzePermissions` でタブ等の設定値・設定元を保持する。
- `getEffectivePermissions` は従来の実効権限を返し、registry に設定一覧を追加する。

#### 既存型 `PermissionHolderInfo`

**属性・型**

```text
PermissionHolderInfo { settings?: readonly PermissionSettingRow[] }
```

**方針**

- `PermissionHolderInfo` などの解析型には参照元付き設定を任意で足す。
- `EffectivePermissionRow` の契約は維持する。

#### 新規関数 `getPermissionSettings`

**引数・戻り値**

```text
getPermissionSettings(input: SnapshotInput, filter: PermissionSettingsFilter): PermissionSettingRow[]
```

**方針**

- `getPermissionSettings(input, filter)` が要求種別と設定元を選ぶ。

#### 新規関数 `permissionSettingsOf`

**引数・戻り値**

```text
permissionSettingsOf(holder: PermissionHolderInfo): PermissionSettingRow[]
```

**方針**

- `permissionSettingsOf(holder)` は権限・表示・割当の行を生成する。

#### 新規型 `PermissionSettingRow`

**属性・型**

```text
PermissionSettingRow { holder: PermissionHolderRef; kind: 'system' | 'custom' | 'tab' | 'recordType' | 'layout' | 'groupMember'; target: string; value: boolean | string; object?: string; recordType?: string }
```

**方針**

- `PermissionSettingRow` は保持者・設定種類・対象・値、必要に応じて object と recordType を持つ。

#### 新規型 `PermissionSettingsFilter`

**属性・型**

```text
PermissionSettingsFilter { kinds?: PermissionSettingRow['kind'][]; holders?: string[] }
```

**方針**

- `PermissionSettingRow` は保持者・設定種類・対象・値、必要に応じて object と recordType を持つ。

**処理・互換性の補足** プロファイル・権限セット・グループの宣言値を種別別の取得関数で返す。実効値と合わせて出す行には、元の権限保持者と割当の文脈を持たせる。

**変更コード案**

```ts
// report/permission.ts
type PermissionSettingRow = {
    holder: PermissionHolderRef;
    kind: 'system' | 'custom' | 'tab' | 'recordType' | 'layout' | 'groupMember';
    target: string;
    value: boolean | string;
    object?: string;
    recordType?: string;
};
// 既存の EffectivePermissionRow と別に設定元の行を返す。
```

**確認ケース** プロファイルにのみ存在する割当、グループによる権限、複数レコードタイプの場合を確認する。

<a id="implementation-detail-59"></a>

## 59. 本文のテキストの表示

**解決したい問題** チームがメールテンプレート本文や Aura helper をレポート内で確認できるようにする。

**現行コード** metadata.properties は解析済みプロパティを出すため、元の本文を単位IDで取得する契約を持たない。

**主な修正先** [`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/types/metadata/markup.ts`](../../src/analyzer/types/metadata/markup.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/analyzer/unit/sourceTree.ts`](../../src/analyzer/unit/sourceTree.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)

**新規パス候補** `src/analyzer/report/sourceText.ts`

**コード修正案** Repository の対象単位から対応ファイルを特定し、許可した種別だけを取得する。viewer は文字列を pre の子として表示し、欠落は診断、空本文は空文字で区別する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- `PROVIDER_DEFINITIONS` と viewer の登録に本文データの入口を追加し、既存のマスク方針を通す。Repositoryの通常の取得口から対象単位を照会する。

#### 既存型の直接変更なし

**方針**

- `ProviderDefinition` や `ReportInput` の共通型は維持する。本文表示のデータスキーマを登録に使用する。

#### 新規関数 `getSourceText`

**引数・戻り値**

```text
getSourceText(input: ReportInput, args: SourceTextArgs): BodyResult
```

**方針**

- `getSourceText(input, args)` は unitId と種別から本文を取得する。

#### 新規関数 `bodyResult`

**引数・戻り値**

```text
bodyResult(unitId: string, asset: SourceTextResult | undefined): BodyResult
```

**方針**

- `bodyResult(unitId, asset)` は空本文と取得不能を分け、`BodyView` はテキストとして描画する。

#### 新規関数 `BodyView`

**引数・戻り値**

```text
BodyView(props: { body: BodyResult }): ReactElement
```

**方針**

- `bodyResult(unitId, asset)` は空本文と取得不能を分け、`BodyView` はテキストとして描画する。

#### 新規型 `SourceTextArgs`

**属性・型**

```text
SourceTextArgs { unitId: string; kind: 'email' | 'visualforce' | 'auraScript' }
```

**方針**

- `SourceTextArgs` は unitId と対象種別、`BodyResult` は本文あり／単位なし／本文なし。

#### 新規型 `SourceTextResult`

**属性・型**

```text
SourceTextResult { filePath: string; text: string }
```

**方針**

- コード例の `SourceTextResult` は本文ありの中身として利用する。

#### 新規型 `BodyResult`

**属性・型**

```text
BodyResult = { ok: true; filePath: string; text: string } | { ok: false; reason: 'unitMissing' | 'bodyMissing'; unitId: string }
```

**方針**

- `SourceTextArgs` は unitId と対象種別、`BodyResult` は本文あり／単位なし／本文なし。

**処理・互換性の補足** ユーザー指定は単位IDとサポート対象の本文種別に限定し、Repository の単位と実ファイルを照合する。出力は本文文字列・表示名とし、viewer はHTMLとして解釈せず表示する。

**変更コード案**

```tsx
// report/sourceText.ts + viewer/report/registry.tsx
type SourceTextArgs = { unitId: string; kind: 'email' | 'visualforce' | 'auraScript' };
type SourceTextResult = { filePath: string; text: string };
const SourceTextView = ({ source }: { source: SourceTextResult }) => (
    <pre aria-label={source.filePath}>{source.text}</pre>
);
// 取得側はユーザー入力を絶対パスにせず、Repository 内の unitId から本文を引く。
```

**適用箇所のコード案**

```tsx
// report/sourceText.ts と viewer の境界
type BodyResult =
    | { ok: true; filePath: string; text: string }
    | { ok: false; reason: 'unitMissing' | 'bodyMissing'; unitId: string };
function bodyResult(unitId: string, asset: { filePath: string; text: string } | undefined): BodyResult {
    return asset
        ? { ok: true, ...asset }
        : { ok: false, reason: 'bodyMissing', unitId };
}
function BodyView({ body }: { body: BodyResult }) {
    if (!body.ok) return <p role="status">本文を取得できませんでした。</p>;
    return <pre aria-label={body.filePath}>{body.text}</pre>;
}
// unit が見つからない分岐は Repository lookup 時に返す。
// 取得経路はマスク方針を維持できるレポート出力の境界へ置く。
```

**確認ケース** Visualforce、メール、Aura JS の本文と、欠落ファイルやHTMLを含む本文の表示を確認する。

<a id="implementation-detail-60"></a>

## 60. 差分の provider

**解決したい問題** 差分レビューで「追加項目3件」「LWC API変更1件」から該当する変更内容へたどりたい。

**現行コード** 既存の一部 provider は差分を持つが、全ドメインの構造差分とファイル差分を一覧・概要へ揃える型がない。

**主な修正先** [`src/analyzer/report/object.ts`](../../src/analyzer/report/object.ts)、[`src/analyzer/report/apex.ts`](../../src/analyzer/report/apex.ts)、[`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/translation.ts`](../../src/analyzer/report/translation.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Apex/diff/`](../../src/analyzer/processor/Apex/diff/)、[`src/analyzer/processor/Lwc/diff/`](../../src/analyzer/processor/Lwc/diff/)、[`src/analyzer/processor/Metadata/diff/`](../../src/analyzer/processor/Metadata/diff/)、[`src/analyzer/unit/gitRange.ts`](../../src/analyzer/unit/gitRange.ts)

**新規パス候補** `src/analyzer/report/change.ts`

**コード修正案** 各内部差分型を種別別の row へ変換し、比較専用として登録する。ファイル結果の一つの集合から概要を計算し、前後の値と変更位置を個別行へ付ける。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- `diffRepositories` とドメインごとの構造Diffを再利用し、`PROVIDER_DEFINITIONS` に個別の差分専用providerを登録する。

#### 既存型の直接変更なし

**方針**

- 既存 `RepositoryUnitDiff` と各ドメインのDiff型は変更不要。登録ごとに比較必須を指定する。

#### 新規関数 `getChangeFiles`

**引数・戻り値**

```text
getChangeFiles(input: ReportInput, args: ChangeFileFilter): ChangeFileRow[]
```

**方針**

- `getChangeFiles(input, args)` はファイル差分を行にし、`summarizeFileChanges(files)` が状態別件数を返す。
- 項目・Apex・LWC等の個別取得関数は対応する構造Diffを行変換する。

#### 新規関数 `summarizeFileChanges`

**引数・戻り値**

```text
summarizeFileChanges(files: readonly ChangeFileRow[]): Record<ChangeFileRow['status'], number>
```

**方針**

- `getChangeFiles(input, args)` はファイル差分を行にし、`summarizeFileChanges(files)` が状態別件数を返す。

#### 新規型 `ChangeFileRow`

**属性・型**

```text
ChangeFileRow { path: string; previousPath?: string; status: 'added' | 'removed' | 'changed' | 'renamed' }
```

**方針**

- `ChangeFileRow` は現在・旧パスと変更状態。
- 各ドメインの差分行は対象ID、変更前後、位置を持つ型または既存スキーマを使う。

#### 新規型 `ChangeFileFilter`

**属性・型**

```text
ChangeFileFilter { paths?: string[] }
```

**方針**

- 各ドメインの差分行は対象ID、変更前後、位置を持つ型または既存スキーマを使う。

#### 新規型 `DomainDiffRow`

**属性・型**

```text
DomainDiffRow { targetId: string; before?: unknown; after?: unknown; sourceKeys?: ConvertKeys }
```

**方針**

- 各ドメインの差分行は対象ID、変更前後、位置を持つ型または既存スキーマを使う。

**処理・互換性の補足** 個別providerは変更前後と関連 sourceKeys を構造Diffから取得する。change.files はファイルの追加・変更・改名・削除を行にし、change.summary は同一データから集計する。

**変更コード案**

```ts
// report/change.ts + registry.ts
type ChangeFileRow = {
    path: string;
    previousPath?: string;
    status: 'added' | 'removed' | 'changed' | 'renamed';
};
function summarizeFileChanges(files: readonly ChangeFileRow[]) {
    const counts = { added: 0, removed: 0, changed: 0, renamed: 0 };
    for (const file of files) counts[file.status]++;
    return counts;
}
// 差分専用 provider の登録は requiresComparison: true とする。
```

**確認ケース** 1時点での診断、変更なし、改名、複数種別を含む比較で各概要の件数を突き合わせる。

<a id="implementation-detail-61"></a>

## 61. チェックの provider

**解決したい問題** LWC から参照している設定と Apex の宣言が一致しない場合、ソース位置付きの指摘にしたい。

**現行コード** crossRef の getMetadataFindings は既存のメタデータ規則を集約する。コード固有の横断ルールを公開する Apex/LWC 用の入口がない。

**主な修正先** [`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/processor/Lwc/interface.ts`](../../src/analyzer/processor/Lwc/interface.ts)

**新規パス候補** `src/analyzer/report/apexFindings.ts`、`src/analyzer/report/lwcFindings.ts`

**コード修正案** 純粋な評価関数としてルールを登録し、評価に必要な解析済みデータだけを渡す。既存 FindingRowSchema で返し、入力不足では誤検出を抑える。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- `getMetadataFindings` は既存範囲を維持する。Apex/LWCの解析済みデータを取得する入口と新providerをつなぐ。

#### 既存型の直接変更なし

**方針**

- `MetadataFinding` と `FindingRowSchema` を再利用するので、共通の診断JSONは変更しない。

#### 新規関数 `evaluateRules`

**引数・戻り値**

```text
evaluateRules<Input>(input: Input, context: MetadataContext, rules: readonly FindingRule<Input>[]): MetadataFinding[]
```

**方針**

- `evaluateRules(input, context, rules)` は各規則の結果に規則IDを付ける。

#### 新規関数 `getApexFindings`

**引数・戻り値**

```text
getApexFindings(input: ReportInput, filter?: ApexFilter): FindingRow[]
```

**方針**

- `getApexFindings` と `getLwcFindings` は対象を選び既存行へ変換する。

#### 新規関数 `getLwcFindings`

**引数・戻り値**

```text
getLwcFindings(input: ReportInput, filter?: LwcFilter): FindingRow[]
```

**方針**

- `getApexFindings` と `getLwcFindings` は対象を選び既存行へ変換する。

#### 新規型 `FindingRule`

**属性・型**

```text
FindingRule<Input> { id: string; evaluate(input: Input, context: MetadataContext): readonly Omit<MetadataFinding, 'code'>[] }
```

**方針**

- `FindingRule<Input>` は id と評価関数を持ち、評価結果は code を除く既存の指摘型を使う。

**処理・互換性の補足** ルールはコードとメタデータの両方から判断できる条件ごとに登録する。評価はID、重大度、根拠位置を共通の指摘型で返し、対象情報を得られない場合の扱いをルール別に定義する。

**変更コード案**

```ts
// report/apexFindings.ts + lwcFindings.ts
type FindingRule<Input> = {
    id: string;
    evaluate(input: Input, context: MetadataContext): readonly Omit<MetadataFinding, 'code'>[];
};
function evaluateRules<Input>(input: Input, context: MetadataContext, rules: readonly FindingRule<Input>[]) {
    return rules.flatMap((rule) =>
        rule.evaluate(input, context).map((finding) => ({ ...finding, code: rule.id }))
    );
}
```

**確認ケース** ルールを満たす例、違反例、必要なメタデータが欠ける例で指摘を比較する。

<a id="implementation-detail-62"></a>

## 62. 画面のスナップショット

**解決したい問題** 明示して要求したコンポーネントにだけ実画像を添え、通常のドキュメント生成は従来の時間で完了させたい。

**現行コード** ProviderDefinition.run と resolveReport は同期。ブラウザ撮影は非同期のため、そのまま既存 provider に入れると呼出し契約が変わる。

**主な修正先** [`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`docs/lwc-snapshot-plan.md`](../../docs/lwc-snapshot-plan.md)、[`docs/examples/lwc/scripts/ssr-snapshot/`](../../docs/examples/lwc/scripts/ssr-snapshot/)

**新規パス候補** `src/analyzer/report/lwcSnapshot.ts`

**コード修正案** 既存ランナーを使う撮影準備を CLI/MCP の非同期段階に置く。撮影結果・失敗理由をリソース参照として同期 provider に渡し、対象を指定しない場合は準備を呼ばない。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- CLI/MCPの明示依頼経路で撮影を準備し、同期の `resolveReport`／provider実行は準備済みデータを読む。
- 通常のビルド入口は撮影を呼ばない。

#### 既存型 `ResolveReportOptions`

**属性・型**

```text
ResolveReportOptions { snapshots?: SnapshotCatalog }
```

**方針**

- `ResolveReportOptions` に任意の撮影結果の参照を渡せる形を加える。
- `ProviderDefinition.run` の全providerを非同期へ変更しない。

#### 新規関数 `prepareSnapshots`

**引数・戻り値**

```text
prepareSnapshots(requests: readonly SnapshotRequest[], capture: SnapshotCapture): Promise<SnapshotCatalog>
```

**方針**

- `prepareSnapshots(requests, capture)` は条件で重複を除いて撮影する。
- providerの取得関数は準備済み索引の結果を読む。

#### 新規関数 `getLwcSnapshot`

**引数・戻り値**

```text
getLwcSnapshot(request: SnapshotRequest, catalog: SnapshotCatalog): SnapshotResult | undefined
```

**方針**

- providerの取得関数は準備済み索引の結果を読む。

#### 新規型 `SnapshotRequest`

**属性・型**

```text
SnapshotRequest { component: string; width: number; height: number }
```

**方針**

- `SnapshotRequest` はコンポーネントと撮影寸法、`SnapshotResult` は画像参照または失敗理由、`SnapshotCapture` は非同期の撮影器、`SnapshotCatalog` は結果索引。

#### 新規型 `SnapshotResult`

**属性・型**

```text
SnapshotResult = { ok: true; mediaType: 'image/png'; resourceId: string } | { ok: false; code: 'componentMissing' | 'captureFailed'; message: string }
```

**方針**

- `SnapshotRequest` はコンポーネントと撮影寸法、`SnapshotResult` は画像参照または失敗理由、`SnapshotCapture` は非同期の撮影器、`SnapshotCatalog` は結果索引。

#### 新規型 `SnapshotCapture`

**属性・型**

```text
SnapshotCapture = (request: SnapshotRequest) => Promise<SnapshotResult>
```

**方針**

- `SnapshotRequest` はコンポーネントと撮影寸法、`SnapshotResult` は画像参照または失敗理由、`SnapshotCapture` は非同期の撮影器、`SnapshotCatalog` は結果索引。

#### 新規型 `SnapshotCatalog`

**属性・型**

```text
SnapshotCatalog = ReadonlyMap<string, SnapshotResult>
```

**方針**

- `SnapshotRequest` はコンポーネントと撮影寸法、`SnapshotResult` は画像参照または失敗理由、`SnapshotCapture` は非同期の撮影器、`SnapshotCatalog` は結果索引。

**処理・互換性の補足** 対象コンポーネントと撮影条件を引数で受け付け、既存の撮影ランナーへ受け渡す。通常のレポート解決と撮影実行の境界を明示し、画像参照と個別失敗の診断を整形する。

**変更コード案**

```ts
// report/lwcSnapshot.ts
type SnapshotRequest = { component: string; width: number; height: number };
type SnapshotResult =
    | { ok: true; mediaType: 'image/png'; resourceId: string }
    | { ok: false; code: 'componentMissing' | 'captureFailed'; message: string };
type SnapshotCapture = (request: SnapshotRequest) => Promise<SnapshotResult>;
// 現行 ProviderDefinition.run は同期。撮影は明示的な非同期準備段階で完了させ、
// lwc.snapshot provider は準備済みの結果を読む設計とする。
```

**適用箇所のコード案**

```ts
// src/builder/reportBuilder.ts と lwcSnapshot.ts の契約
type SnapshotCatalog = ReadonlyMap<string, SnapshotResult>;
type SnapshotResolverOptions = ResolveReportOptions & { snapshots?: SnapshotCatalog };
async function prepareSnapshots(requests: readonly SnapshotRequest[], capture: SnapshotCapture) {
    const records = new Map<string, SnapshotResult>();
    for (const request of requests) {
        const key = JSON.stringify([request.component, request.width, request.height]);
        if (!records.has(key)) records.set(key, await capture(request));
    }
    return records;
}
// builder が provider 外部結果を受け取る明示的な入力境界を追加する。
// for で撮影対象が変わる場合は対象列挙と撮影準備を分ける設計が必要。
// 現行の同期 run を維持する最初の実装は、明示された対象の撮影から始める。
```

**確認ケース** 撮影省略の場合にブラウザを起動せず、明示した場合の成功・対象不明・撮影失敗が区別できることを確認する。

<a id="implementation-detail-66"></a>

## 66. 列の既定

**解決したい問題** DataTable で列を省略して object.list を表示したときに、日本語ラベルと意味のある列順を使いたい。

**現行コード** RowsTable の columnsOf は行のキーから列を推論する。ProviderDefinition に表示用の列定義がないので、ドキュメント側で毎回指定する必要がある。

**主な修正先** [`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/types.ts`](../../src/analyzer/report/types.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)、[`docs/catalog/generate.ts`](../../docs/catalog/generate.ts)

**コード修正案** rows provider の定義に既定 columns 値を追加する。resolveReport は要素のデータバインディングから provider を引き、対象が表かつ列未指定の場合だけ props を補う。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `resolveReport` がデータバインディングを検査する段階で表の provider の既定列を補う。

#### 既存関数 `buildReportCatalog`

**引数・戻り値**

```text
buildReportCatalog(): ReportCatalog
```

**方針**

- `buildReportCatalog` も既定列を公開し、`RowsTable` の従来推論は残す。

#### 既存型 `ProviderDefinition`

**属性・型**

```text
ProviderDefinition { columns?: readonly DefaultColumn[] }
```

**方針**

- `ProviderDefinition` と `ProviderEntry` に任意の列配列を追加する。
- `Column` 相当のキー・表示名を共有し、明示列や行列部品の既定値を上書きしない。

#### 既存型 `ProviderEntry`

**属性・型**

```text
ProviderEntry { columns?: readonly DefaultColumn[] }
```

**方針**

- `ProviderDefinition` と `ProviderEntry` に任意の列配列を追加する。

#### 新規関数 `applyTableDefaults`

**引数・戻り値**

```text
applyTableDefaults(props: Record<string, unknown>, defaults: ProviderTableDefaults): Record<string, unknown>
```

**方針**

- `applyTableDefaults(props, defaults)` は列未指定の表にだけ既定列を適用する。

#### 新規型 `DefaultColumn`

**属性・型**

```text
DefaultColumn { key: string; label: string }
```

**方針**

- `DefaultColumn` は viewer と共用可能な場合、共通列型を再利用する。

#### 新規型 `ProviderTableDefaults`

**属性・型**

```text
ProviderTableDefaults { columns?: readonly DefaultColumn[] }
```

**方針**

- `ProviderTableDefaults` は optional columns の内部契約。

**処理・互換性の補足** ProviderDefinition の既定列をドキュメント解決時に読み、対象が表で明示列が未指定の場合に設定する。表の列推論は既定列を持たないproviderで使用する。

**変更コード案**

```ts
// report/registry.ts + builder/reportBuilder.ts
type DefaultColumn = { key: string; label: string };
type ProviderTableDefaults = { columns?: readonly DefaultColumn[] };
function applyTableDefaults(
    props: Record<string, unknown>,
    defaults: ProviderTableDefaults,
): Record<string, unknown> {
    if (props.columns != null || defaults.columns === undefined) return props;
    return { ...props, columns: defaults.columns };
}
// 表のバインディングに限って適用し、Matrix 等の独自の列定義には触れない。
```

**確認ケース** 明示列、provider既定列、自動推論の優先順と、カタログの日本語名を確認する。

<a id="implementation-detail-67"></a>

## 67. `apex.outline` に `signature` の列を足す

**解決したい問題** 雛形で名前と params を連結せず、apex.outline が返した署名を apex.methodFlow の抽出へ直接渡したい。

**現行コード** getApexOutline は行を rest と一緒に出すが signature は独立列ではない。detailTemplates.ts が m.name と m.params を文字列でつないでいる。

**主な修正先** [`src/analyzer/report/apex.ts`](../../src/analyzer/report/apex.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)、[`src/mcp/prompts.ts`](../../src/mcp/prompts.ts)

**コード修正案** フロー出力と同じ署名の規則を一箇所に寄せ、メソッド行へ signature を付ける。型スキーマと案内、生成済み雛形を更新し、名前と params の従来列は維持する。

### 関数・型の変更一覧

#### 既存関数 `getApexOutline`

**引数・戻り値**

```text
getApexOutline(input: SnapshotInput, filter?: ApexFilter & { includeTests?: boolean }): ApexOutlineRow[]
```

**方針**

- `getApexOutline` のメソッド行作成時に既存のフローと同じ署名を出す。
- detailTemplates の where 式とカタログの例を `m.signature` へ更新する。

#### 既存型 `ApexOutlineRow`

**属性・型**

```text
ApexOutlineRow { signature?: string }
```

**方針**

- `ApexOutlineRowSchema` に `signature` を追加する。
- 非メソッド行等と同じ型なら任意とし、name・params を残す。

#### 新規関数 `signatureOf`

**引数・戻り値**

```text
signatureOf(name: string, params: readonly string[]): string
```

**方針**

- 署名を生成する既存処理が分散している場合は `signatureOf(name, params)` を共通化する。
- 書式はフロー側のフィルターと一致させる。

#### 新規型なし

**方針**

- 新規公開型は不要。行型は既存スキーマへの文字列属性から導く。

**処理・互換性の補足** メソッド名と正規化した引数型を既存の署名形式で組み立て、apex.outline から呼出し対象指定へそのまま渡す。既存の name と params 列は出力に維持する。

**変更コード案**

```ts
// report/apex.ts + schemas.ts
function signatureOf(name: string, params: readonly string[]): string {
    return name + '(' + params.join(', ') + ')';
}
const outlineShape = { signature: z.string() };
// getApexOutline のメソッド行に signatureOf(name, params) をセットする。
// メソッド以外にも同じスキーマを使う場合は signature を任意にする。
```

**確認ケース** 引数0件・複数件・オーバーロードで m.signature が受け側で解決できることを確認する。

<a id="implementation-detail-68"></a>

## 68. `metadata.units` などの行にノードの id を持たせる

**解決したい問題** 項目のループから対象オブジェクトの依存図を表示するとき、object: を雛形で手作業で前置しない。

**現行コード** getMetadataUnits は種別・単位名を個別に持つ。依存グラフが要求する種別付きIDとは別なので、テンプレートが連結を行っている。

**主な修正先** [`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)、[`src/analyzer/report/object.ts`](../../src/analyzer/report/object.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/dependency/units.ts`](../../src/analyzer/processor/dependency/units.ts)、[`src/analyzer/processor/dependency/types.ts`](../../src/analyzer/processor/dependency/types.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)

**コード修正案** 依存ノードの生成規則を共用し、対応する行に nodeId を付ける。雛形の対象引数を列の参照へ変更し、対応ノードを持たない種別では nodeId を省略する。

### 関数・型の変更一覧

#### 既存関数 `getMetadataUnits`

**引数・戻り値**

```text
getMetadataUnits(input: ReportInput, filter?: MetadataFilter): MetadataUnitRow[]
```

**方針**

- `getMetadataUnits` と `getObjectList` は依存ノードのIDを転記する。
- `feature_overview` 等の対象を組み立てる雛形を nodeId 参照へ変える。

#### 既存関数 `getObjectList`

**引数・戻り値**

```text
getObjectList(input: SnapshotInput, filter?: ObjectFilter): ObjectListRow[]
```

**方針**

- `getMetadataUnits` と `getObjectList` は依存ノードのIDを転記する。

#### 既存型 `MetadataUnitRow`

**属性・型**

```text
MetadataUnitRow { nodeId?: string }
```

**方針**

- `MetadataUnitRowSchema` と `ObjectListRowSchema` に任意の nodeId を追加する。
- 対応するグラフノードがない行は省略する。

#### 既存型 `ObjectListRow`

**属性・型**

```text
ObjectListRow { nodeId?: string }
```

**方針**

- `MetadataUnitRowSchema` と `ObjectListRowSchema` に任意の nodeId を追加する。

#### 新規関数 `attachNodeId`

**引数・戻り値**

```text
attachNodeId<T extends object>(row: T, nodeId: string | undefined): T & { nodeId?: string }
```

**方針**

- 依存グラフの規則で得た nodeId がある場合にだけ返却行に追加する。対応のない種別では元の行を返す。

#### 新規型なし

**方針**

- `MetadataUnitWithNodeId` は説明用の合成。実際は既存スキーマから型を推論し、同じ行型の別名を増やさない。

**処理・互換性の補足** 依存グラフのノードキーを作る既存規則を表でも使い、種別付きIDを行に加える。雛形が文字列を組み立てていた箇所を nodeId 参照に差し替える。

**変更コード案**

```ts
// report/metadata.ts + schemas.ts
type MetadataUnitWithNodeId = MetadataUnitRow & { nodeId?: string };
function attachNodeId(row: MetadataUnitRow, nodeId: string | undefined): MetadataUnitWithNodeId {
    return nodeId === undefined ? row : { ...row, nodeId };
}
// メタデータ種別から依存ノードへの対応にはグラフの既存ID生成を使う。
```

**確認ケース** 同名で種別が異なる単位とフォルダ付き単位で、行から feature.scope に渡した対象が一致することを確認する。

<a id="implementation-detail-69"></a>

## 69. 引数の名前と値の形をそろえる

**解決したい問題** 同じ LWC を c/accountList と accountList で指定した既存文書が、providerによって違う結果にならないようにする。

**現行コード** 各 provider は components、classes、members の入力を個々に照合する。既存のカタログ説明から受理される形式を追う必要がある。

**主な修正先** [`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/report/apex.ts`](../../src/analyzer/report/apex.ts)、[`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/members.ts`](../../src/analyzer/report/members.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)、[`src/report/domainTemplates.ts`](../../src/report/domainTemplates.ts)

**コード修正案** Zod または共通の正規化で、種別に応じて内部形式を作る。LWC の c/ は別名として受け、Apex の署名や別名前空間を無条件に切り詰めない。

### 関数・型の変更一覧

#### 既存関数 `getLwcComponents`

**引数・戻り値**

```text
getLwcComponents(input: SnapshotInput, filter?: LwcFilter): LwcComponentRow[]
```

**方針**

- report registry の provider 引数スキーマと、`getLwcComponents` 等のフィルターに渡る値の正規化をそろえる。

#### 既存型 `LwcFilter`

**属性・型**

```text
LwcFilter { components?: string[] }
```

**方針**

- `LwcFilter` や `ApexFilter` は既存の文字列配列を維持する。
- Zodの受理値と正規化後の値を区別する。

#### 既存型 `ApexFilter`

**属性・型**

```text
ApexFilter { classes?: string[] }
```

**方針**

- `LwcFilter` や `ApexFilter` は既存の文字列配列を維持する。

#### 新規関数 `normalizeLwcComponents`

**引数・戻り値**

```text
normalizeLwcComponents(values: readonly string[]): string[]
```

**方針**

- `normalizeLwcComponents(values)` は c/ の別表記と重複を処理する。
- Apexメンバーは署名を壊さない別処理を使う。

#### 新規型なし

**方針**

- 公開型の追加は不要。Zod の input/output 型を使って境界を表す。

**処理・互換性の補足** 正規化の入口を provider スキーマか共通関数に決め、受理する既存表記と内部表記をカタログに記載する。形の違いが同一対象を示す場合は内部IDで重複排除する。

**変更コード案**

```ts
// report/schemas.ts
const lwcComponentsArg = z.array(z.string().trim().min(1)).transform((values) =>
    [...new Set(values.map((value) => value.startsWith('c/') ? value.slice(2) : value))]
).optional();
const lwcFilterArgs = z.object({ components: lwcComponentsArg });
// 名前空間付きの別モジュールやメンバー署名は専用の正規化を通す。
```

**確認ケース** c/ の有無、名前リスト、空引数、形式不正で入力とエラーを照合する。

<a id="implementation-detail-70"></a>

## 70. `object.list` の種類の分け

**解決したい問題** カスタムメタデータ型だけを feature_overview の開始点にする、あるいは除く選択をしたい。

**現行コード** getObjectList は json.objectType を転記する。既存の概要雛形は objectType: custom で一覧を選ぶため、用途の異なる定義がまとまる。

**主な修正先** [`src/analyzer/report/object.ts`](../../src/analyzer/report/object.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/types/metadata/object.ts`](../../src/analyzer/types/metadata/object.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)

**コード修正案** 詳細種別を新列に足す案を第一候補にし、既存 objectType フィルターを保つ。カスタム設定・メタデータ型・イベントを判定し、開始点フィルターを詳細種別へ移す。

### 関数・型の変更一覧

#### 既存関数 `getObjectList`

**引数・戻り値**

```text
getObjectList(input: SnapshotInput, filter?: ObjectFilter): ObjectListRow[]
```

**方針**

- `getObjectList` は属性とAPI名から詳細種別を計算し、`feature_overview` の絞り込み条件を更新する。

#### 既存型 `ObjectListRow`

**属性・型**

```text
ObjectListRow { objectType: string; objectKind?: ObjectKind }
```

**方針**

- `ObjectListRowSchema` に任意の objectKind を加え、既存 objectType による検索を維持する。

#### 新規関数 `objectKindOf`

**引数・戻り値**

```text
objectKindOf(object: ObjectClassificationInput): ObjectKind
```

**方針**

- `objectKindOf(object)` はカスタム設定の属性を優先し、カスタムメタデータ型・イベント・通常項目を分類する。

#### 新規型 `ObjectKind`

**属性・型**

```text
ObjectKind = 'standard' | 'custom' | 'customSetting' | 'customMetadata' | 'platformEvent' | 'bigObject' | 'externalObject'
```

**方針**

- `ObjectKind` は standard/custom/customSetting/customMetadata/platformEvent。

#### 新規型 `ObjectClassificationInput`

**属性・型**

```text
ObjectClassificationInput { apiName: string; objectType: string; customSettingsType?: string }
```

**方針**

- `ObjectClassificationInput` は分類のために必要な属性だけを返す内部型。


**変更コード案**

```ts
// report/object.ts + schemas.ts
// ObjectListRowSchema に objectKind を任意で追加し、既存の objectType を維持する。
const ObjectKind = z.enum([
    'standard', 'custom', 'customSetting', 'customMetadata', 'platformEvent', 'bigObject', 'externalObject',
]);
type ObjectKind = z.infer<typeof ObjectKind>;
function objectKindOf(object: ObjectClassificationInput): ObjectKind {
    if (object.customSettingsType) return 'customSetting';
    if (object.objectType === 'bigObject' || object.objectType === 'externalObject') return object.objectType;
    if (object.apiName.endsWith('__mdt')) return 'customMetadata';
    if (object.apiName.endsWith('__e')) return 'platformEvent';
    return object.apiName.endsWith('__c') ? 'custom' : 'standard';
}
```

**確認ケース** 通常のカスタムオブジェクト、カスタム設定、カスタムメタデータ型、イベントを並べて照合する。

<a id="implementation-detail-71"></a>

## 71. `feature.scope` の範囲の制御

**解決したい問題** Account を開始点にしたとき、実質関係の薄い数百ノードで概要が埋まるのを抑えたい。

**現行コード** getFeatureScope は深さや既存の条件に従って対象をたどるが、各段の件数制約と省略の通知を同時には扱わない。

**主な修正先** [`src/analyzer/report/feature.ts`](../../src/analyzer/report/feature.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/dependency/graph.ts`](../../src/analyzer/processor/dependency/graph.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)

**コード修正案** 探索時に段ごとの候補を安定順にして、種別と上限を適用する。除外ノードを探索で経由するかを明示し、結果行とは別に省略数を返す方法を決める。

### 関数・型の変更一覧

#### 既存関数 `getFeatureScope`

**引数・戻り値**

```text
getFeatureScope(input: ReportInput, args: FeatureScopeArgs): FeatureScopeRow[]
```

**方針**

- `getFeatureScope` の探索で深さごとの候補をそろえ、種別と上限を適用する。
- 既存の行データ参照は維持する。

#### 既存型 `FeatureScopeArgs`

**属性・型**

```text
FeatureScopeArgs { maxPerDepth?: number; excludeTypes?: string[] }
```

**方針**

- `FeatureScopeArgs` に任意の maxPerDepth と excludeTypes を追加する。
- 省略情報は既存の行配列を壊さない返却経路を設ける。

#### 新規関数 `limitScopeLayer`

**引数・戻り値**

```text
limitScopeLayer(nodes: readonly ScopedNode[], maximum: number | undefined): { shown: ScopedNode[]; omitted: number }
```

**方針**

- `limitScopeLayer(nodes, maximum)` は安定順の候補と省略件数を返す。
- 探索側が次段へ進める条件をまとめて管理する。

#### 新規型 `ScopedNode`

**属性・型**

```text
ScopedNode { id: string; type: string; depth: number }
```

**方針**

- `ScopedNode` は段・ノードIDを扱う内部型で、既存グラフ型で代替できる場合は導入しない。

#### 新規型 `FeatureScopeLimits`

**属性・型**

```text
FeatureScopeLimits { maxPerDepth?: number; excludeTypes?: string[] }
```

**方針**

- `FeatureScopeLimits` は引数の追加スキーマ。

**処理・互換性の補足** 探索を段ごとに進め、種別と件数制約を決定的な順で適用する。除外種別を経由する探索可否を引数の仕様に明記し、どこで件数が省略されたかを返す。

**変更コード案**

```ts
// report/feature.ts + schemas.ts
const FeatureScopeLimits = z.object({
    maxPerDepth: z.number().int().positive().optional(),
    excludeTypes: z.array(z.string()).optional(),
});
function limitScopeLayer(nodes: readonly ScopedNode[], maximum: number | undefined) {
    const ordered = [...nodes].sort((left, right) => left.id.localeCompare(right.id));
    const shown = maximum === undefined ? ordered : ordered.slice(0, maximum);
    return { shown, omitted: ordered.length - shown.length };
}
```

**確認ケース** 同じグラフを順序の異なる入力で渡し、同じ行と省略件数になることを確認する。

<a id="implementation-detail-72"></a>

## 72. 処理フローの分類を、解析の結果で決める

**解決したい問題** 独自の dispatchEvent という関数を、LWC 標準イベント送信として表示しない。

**現行コード** apexFlow.ts と lwcFlow.ts の simpleKindOf はソース文字列のパターンも使う。calls.ts には呼出しの解決情報があるが分類器に接続されていない。

**主な修正先** [`src/analyzer/report/apexFlow.ts`](../../src/analyzer/report/apexFlow.ts)、[`src/analyzer/report/lwcFlow.ts`](../../src/analyzer/report/lwcFlow.ts)、[`src/analyzer/report/codeFlow.ts`](../../src/analyzer/report/codeFlow.ts)、[`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/processor/Lwc/calls.ts`](../../src/analyzer/processor/Lwc/calls.ts)

**コード修正案** 文の sourceKeys に基づき呼出しを事前索引化する。分類器は解析済み callType とクエリ・DML 文の構造を使い、一文の複数操作の優先順を固定する。

### 関数・型の変更一覧

#### 既存関数 `apexFlow.classifierOf`

**引数・戻り値**

```text
apexFlow.classifierOf(result: ApexUnitParseResult): StatementClassifier<StatementJson>
```

**方針**

- `apexFlow.ts`／`lwcFlow.ts` の `classifierOf` と `simpleKindOf` はテキストパターンから解析済み情報への参照に変更する。

#### 既存関数 `lwcFlow.classifierOf`

**引数・戻り値**

```text
lwcFlow.classifierOf(bundle: Bundle, module: LwcModuleJson): StatementClassifier<LwcJsStatementJson>
```

**方針**

- `apexFlow.ts`／`lwcFlow.ts` の `classifierOf` と `simpleKindOf` はテキストパターンから解析済み情報への参照に変更する。

#### 既存型 `ApexCallInfo`

**属性・型**

```text
ApexCallInfo { sourceKeys: ConvertKeys; callType: ApexCallType }
```

**方針**

- `ClassifiedStatement` の simple kind は既存の列挙値を使う。
- 必要なら呼出し情報に文位置を任意で補う。

#### 既存型 `LwcCallInfo`

**属性・型**

```text
LwcCallInfo { sourceKeys: ConvertKeys; callType: LwcCallType }
```

**方針**

- `ClassifiedStatement` の simple kind は既存の列挙値を使う。

#### 新規関数 `apexCallKind`

**引数・戻り値**

```text
apexCallKind(call: ApexCallInfo): SimpleNodeKind
```

**方針**

- `apexCallKind(call)` と LWC 側の対応処理は callType を既存ノード種別へ変換する。
- 位置索引は一文の呼出しを順に返す。

#### 新規関数 `lwcCallKind`

**引数・戻り値**

```text
lwcCallKind(call: LwcCallInfo): SimpleNodeKind
```

**方針**

- 位置索引は一文の呼出しを順に返す。

#### 新規型 `SimpleNodeKind`

**属性・型**

```text
SimpleNodeKind = Extract<ClassifiedStatement<unknown>, { type: 'simple' }>['kind']
```

**方針**

- `SimpleNodeKind` は既存 `ClassifiedStatement` の simple 分岐から導く。
- 公開ノード型は追加しない。

**処理・互換性の補足** 各文の範囲に含まれる解析済み呼出しを位置順に引く。複数ある場合の分類優先順を言語側の分類器で定義し、位置が不明な文は一般処理として描く。

**変更コード案**

```ts
// report/apexFlow.ts
type SimpleNodeKind = Extract<ClassifiedStatement<unknown>, { type: 'simple' }>['kind'];
const apexCallNodeKind: Partial<Record<ApexCallType, SimpleNodeKind>> = {
    dynamicQuery: 'query', dml: 'dml', callout: 'callout', publish: 'event',
    async: 'call', method: 'call',
};
function apexCallKind(call: ApexCallInfo): SimpleNodeKind {
    return apexCallNodeKind[call.callType] ?? 'process';
}
// 静的SOQL/DML文は既存の queries/dml 解析も参照し、呼出し式の位置と区別する。
```

**確認ケース** 標準API、同名のユーザー定義メソッド、一文に複数の呼出しがある例でノード種別を確認する。

<a id="implementation-detail-73"></a>

## 73. 処理フローの対象を広げる

**解決したい問題** Apex の property getter や static 初期化ブロックも、メソッドと同様に図で確認したい。

**現行コード** targetsOfClass 等が FlowTarget を列挙し、getApexMethodFlows が対象を選ぶ。アクセサーと初期化ブロックは通常の署名だけでは識別できない。

**主な修正先** [`src/analyzer/report/apexFlow.ts`](../../src/analyzer/report/apexFlow.ts)、[`src/analyzer/report/apex.ts`](../../src/analyzer/report/apex.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/types/apex/declaration.ts`](../../src/analyzer/types/apex/declaration.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)

**コード修正案** 対象型に method・accessor・initializer を持たせる。アクセサーは property と get/set、初期化は static/instance と宣言順をキーにし、既存分類器へ本体だけを渡す。

### 関数・型の変更一覧

#### 既存関数 `targetsOfClass`

**引数・戻り値**

```text
targetsOfClass(declaration: ClassDeclarationJson, owner: string): FlowTarget[]
```

**方針**

- `targetsOfClass` と `getApexMethodFlows` はアクセサー・初期化本体を列挙して既存生成器へ渡す。

#### 既存関数 `getApexMethodFlows`

**引数・戻り値**

```text
getApexMethodFlows(input: SnapshotInput, filter?: ApexFlowFilter): CodeFlow[]
```

**方針**

- `targetsOfClass` と `getApexMethodFlows` はアクセサー・初期化本体を列挙して既存生成器へ渡す。

#### 既存型 `CodeFlow`

**属性・型**

```text
CodeFlow {
    memberType: 'method' | 'constructor' | 'trigger' | 'anonymous' | 'function'
        | 'accessor' | 'initializer';
}
```

**方針**

- `CodeFlowSchema.memberType` は accessor/initializer を扱えるようにし、既存 method・constructor 等の値と選択規則を維持する。

#### 新規関数 `targetId`

**引数・戻り値**

```text
targetId(owner: string, target: ApexFlowTarget): string
```

**方針**

- `targetId(owner, target)` はプロパティ、get/set、static/instance、宣言順で一意なキーを作る。

#### 新規型 `ApexFlowTarget`

**属性・型**

```text
ApexFlowTarget = { kind: 'method'; signature: string } | { kind: 'accessor'; property: string; accessor: 'get' | 'set' } | { kind: 'initializer'; scope: 'static' | 'instance'; ordinal: number }
```

**方針**

- `ApexFlowTarget` は従来のメソッド対象と accessor・initializer を表す内部共用体。
- 既存 `FlowTarget` に統合する。

**処理・互換性の補足** 宣言の走査で getter、setter、static とインスタンスの初期化ブロックを既存ビルダーへ渡す。プロパティ・アクセサー種別や位置を選択キーにして同名のメソッドと区別する。

**変更コード案**

```ts
// report/apexFlow.ts
type ApexFlowTarget =
    | { kind: 'method'; signature: string }
    | { kind: 'accessor'; property: string; accessor: 'get' | 'set' }
    | { kind: 'initializer'; scope: 'static' | 'instance'; ordinal: number };
function targetId(owner: string, target: ApexFlowTarget): string {
    if (target.kind === 'method') return owner + '.' + target.signature;
    if (target.kind === 'accessor') return [owner, target.property, target.accessor].join('#');
    return [owner, target.scope, target.ordinal].join('#');
}
```

**確認ケース** 同名メソッド、get/set の両方、同一クラス内の複数初期化ブロックを確認する。

<a id="implementation-detail-74"></a>

## 74. LWC の Promise の流れ

**解決したい問題** save().then(update).catch(showError).finally(stopBusy) を、成功・失敗の経路で表示したい。

**現行コード** LwcPromiseUseInfo が解析結果にあるが、lwcFlow.ts の文分類だけではチェーンに沿った成功／失敗の継続を描けない。

**主な修正先** [`src/analyzer/report/lwcFlow.ts`](../../src/analyzer/report/lwcFlow.ts)、[`src/analyzer/processor/Lwc/calls.ts`](../../src/analyzer/processor/Lwc/calls.ts)、[`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)

**コード修正案** チェーン順を抽出して前段の成功・失敗の出口を別に保持する。then と catch は該当出口を消費し、finally 正常完了時は流入時の成否を引き継ぐ。

### 関数・型の変更一覧

#### 既存関数 `lwcFlow.classifierOf`

**引数・戻り値**

```text
lwcFlow.classifierOf(bundle: Bundle, module: LwcModuleJson): StatementClassifier<LwcJsStatementJson>
```

**方針**

- `lwcFlow.ts` の `classifierOf` は解析済み Promise チェーンを受け、`buildCodeFlow` が成功・失敗・後処理の接続を作れる形に渡す。

#### 既存関数 `buildCodeFlow`

**引数・戻り値**

```text
buildCodeFlow<S>(title: string, body: S[], classify: StatementClassifier<S>): { nodes: CodeFlowNode[]; edges: CodeFlowEdge[] }
```

**方針**

- `lwcFlow.ts` の `classifierOf` は解析済み Promise チェーンを受け、`buildCodeFlow` が成功・失敗・後処理の接続を作れる形に渡す。

#### 既存型 `CodeFlowEdge`

**属性・型**

```text
CodeFlowEdge {
    from: string;
    to: string;
    kind: 'normal' | 'yes' | 'no' | 'case' | 'loop' | 'back' | 'exception'
        | 'promiseSuccess' | 'promiseFailure' | 'promiseFinally';
    label?: string;
}
```

**方針**

- `LwcPromiseUseInfo` に既存の方針で取得できる順序と位置が揃っていれば再利用する。
- 辺の意味が増える場合は `CodeFlowEdgeSchema` と表示を更新する。

#### 新規関数 `incomingPromiseExits`

**引数・戻り値**

```text
incomingPromiseExits(step: PromiseFlowStep, previous: PromiseExits): readonly string[]
```

**方針**

- `incomingPromiseExits(step, previous)` は then/catch/finally へ流入する出口を選ぶ。
- 後処理の正常終了では流入状態を引き継ぐ。

#### 新規型 `PromiseFlowStep`

**属性・型**

```text
PromiseFlowStep { id: string; kind: 'then' | 'catch' | 'finally'; sourceKeys: ConvertKeys }
```

**方針**

- `PromiseFlowStep` は then/catch/finally と位置、`PromiseExits` は成功・失敗の出口リスト。

#### 新規型 `PromiseExits`

**属性・型**

```text
PromiseExits { success: readonly string[]; failure: readonly string[] }
```

**方針**

- `PromiseFlowStep` は then/catch/finally と位置、`PromiseExits` は成功・失敗の出口リスト。

**処理・互換性の補足** 追跡できる Promise チェーンを then/catch/finally の順序付きイベントとして渡す。直前の成功と失敗の接続先を別々に保持し、finally からは元の継続先へつなぐ。

**変更コード案**

```ts
// report/lwcFlow.ts
type PromiseFlowStep = {
    id: string;
    kind: 'then' | 'catch' | 'finally';
    sourceKeys: ConvertKeys;
};
type PromiseExits = { success: readonly string[]; failure: readonly string[] };
function incomingPromiseExits(step: PromiseFlowStep, previous: PromiseExits): readonly string[] {
    if (step.kind === 'then') return previous.success;
    if (step.kind === 'catch') return previous.failure;
    return [...previous.success, ...previous.failure];
}
// finally の正常終了は流入時の成功／失敗を引き継ぐ。
```

**確認ケース** 複数 then、途中 catch、最後の finally、解析しきれない別名呼出しを確認する。

<a id="implementation-detail-75"></a>

## 75. JS の switch の中の break

**解決したい問題** while 内の switch の case の if から break したとき、while の次の文まで飛ぶ線を修正する。

```js
while (active()) {
    switch (state) {
        case 'ready':
            if (skip()) break;
            process();
            break;
    }
    afterSwitch();
}
// if 内の break の次は afterSwitch()。while 終了への辺にはしない。
```

**現行コード** buildCodeFlow は LoopContext[] を渡し、switch のケースも同じ loops を受け取る。break の行き先は最後の loop なので switch の境界が無視される。

**主な修正先** [`src/analyzer/report/codeFlow.ts`](../../src/analyzer/report/codeFlow.ts)、[`test/processor/code-flow-providers.test.ts`](../../test/processor/code-flow-providers.test.ts)

**コード修正案** loop と switch を含む制御フレームを渡す。switch ではケースの正常終了と自身が収集した break を合流させ、continue だけ最も内側の loop を選ぶ。

### 関数・型の変更一覧

#### 既存関数 `buildCodeFlow`

**引数・戻り値**

```text
buildCodeFlow<S>(title: string, body: S[], classify: StatementClassifier<S>): { nodes: CodeFlowNode[]; edges: CodeFlowEdge[] }
```

**方針**

- `buildCodeFlow` 内の `build`、switch/loop/break/continue 分岐を更新する。
- switch から出る辺を分岐の正常終了と合流させる。

#### 既存関数 `build`

**引数・戻り値**

```text
build(statements: S[], entries: Exit[], controls: ControlContext[]): Exit[]
```

**方針**

- `buildCodeFlow` 内の `build`、switch/loop/break/continue 分岐を更新する。

#### 既存型 `LoopContext`

**属性・型**

```text
LoopContext = ControlContext へ置換
```

**方針**

- 内部 `LoopContext` を `ControlContext` へ置き換える。
- 公開の `CodeFlowNode`／`CodeFlowEdge` の変更は不要。

#### 新規関数 `applyBreak`

**引数・戻り値**

```text
applyBreak(exits: Exit[], controls: readonly ControlContext[]): Exit[]
```

**方針**

- `applyBreak(exits, controls)` は最も内側の制御境界へ脱出を記録し、continue は最も内側のループを検索する。

#### 新規型 `ControlContext`

**属性・型**

```text
ControlContext = { kind: 'loop'; head: string; breaks: Exit[] } | { kind: 'switch'; breaks: Exit[] }
```

**方針**

- `ControlContext` は loop(head, breaks) と switch(breaks) の判別共用体。

**処理・互換性の補足** switch の処理で自身の終了先を break のスタックへ積み、continue には最も内側のループの情報を使う。case 内の if やネストしたループに同じ走査状態を渡す。

**変更コード案**

```ts
// report/codeFlow.ts
type ControlContext =
    | { kind: 'loop'; head: string; breaks: Exit[] }
    | { kind: 'switch'; breaks: Exit[] };
function applyBreak(exits: Exit[], controls: readonly ControlContext[]): Exit[] {
    const target = controls.at(-1);
    if (!target) return exits;
    target.breaks.push(...exits);
    return [];
}
// continue は controls.findLast で loop を選び、その head へ接続する。
```

**適用箇所のコード案**

```ts
// src/analyzer/report/codeFlow.ts の build 内
switch (c.type) {
    case 'switch': {
        const id = node({
            kind: 'decision',
            label: firstLine(c.subject),
            detail: detailOf([c.subject]),
            ...lineOf(c.line),
        });
        connect(exits, id);
        const frame: ControlContext = { kind: 'switch', breaks: [] };
        const caseExits = c.cases.flatMap((branch) => build(
            branch.body,
            [{ from: id, kind: 'case', label: branch.label }],
            [...controls, frame],
        ));
        const defaultExit: Exit[] = c.cases.some((branch) => branch.isElse)
            ? []
            : [{ from: id, kind: 'case', label: 'その他' }];
        exits = [...caseExits, ...frame.breaks, ...defaultExit];
        break;
    }
    case 'break': {
        exits = applyBreak(exits, controls);
        break;
    }
    case 'continue': {
        const loop = controls.findLast((frame) => frame.kind === 'loop');
        if (!loop) break;
        connect(exits, loop.head, { kind: 'back', label: undefined });
        exits = [];
        break;
    }
    // loop の frame は kind: 'loop' を付け、inLoop は controls 内の loop の有無で判定する。
}
```

**確認ケース** ループ中の switch にある if 内 break と、switch 内ループの break／continue で辺を確認する。

<a id="implementation-detail-76"></a>

## 76. 大きいメソッドの処理フロー

**解決したい問題** 大きな Apex メソッドのループと try を概要では閉じ、必要になったときだけ詳細を展開したい。

**現行コード** buildCodeFlow は平坦な nodes/edges を返す。文の集約はあるが、ビューにループや例外区画の境界が渡らない。

**主な修正先** [`src/analyzer/report/codeFlow.ts`](../../src/analyzer/report/codeFlow.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/viewer/report/components/codeFlowchart.tsx`](../../src/viewer/report/components/codeFlowchart.tsx)

**コード修正案** 生成時にグループに属するノードと境界の辺を記録する。viewer は閉じたグループの端点を代表ノードへ変換し、除外分が上限で省かれた場合は件数を表示する。

### 関数・型の変更一覧

#### 既存関数 `buildCodeFlow`

**引数・戻り値**

```text
buildCodeFlow<S>(title: string, body: S[], classify: StatementClassifier<S>): { nodes: CodeFlowNode[]; edges: CodeFlowEdge[]; groups?: CodeFlowGroup[] }
```

**方針**

- `buildCodeFlow` はループ・try の出入りを記録する。

#### 既存関数 `CodeFlowchartView`

**引数・戻り値**

```text
CodeFlowchartView(props: { data: CodeFlow[] | undefined; member?: string | null; height?: number | null }): ReactElement
```

**方針**

- `CodeFlowchartView`／`toElements` は開閉に応じて表示ノードと境界の辺を作る。

#### 既存型 `CodeFlow`

**属性・型**

```text
CodeFlow { groups?: CodeFlowGroup[]; omittedNodes?: number }
```

**方針**

- `CodeFlowSchema` に任意の groups と省略件数を加える。
- 既存グループなしのデータでは従来の平坦な描画を使う。

#### 新規関数 `collectFlowGroups`

**引数・戻り値**

```text
collectFlowGroups(body: readonly ClassifiedStatement<unknown>[]): CodeFlowGroup[]
```

**方針**

- グループ境界を集める `collectFlowGroups` と、表示時に辺の端点を代表ノードへ写す `collapseFlowGroups` を追加する。

#### 新規関数 `collapseFlowGroups`

**引数・戻り値**

```text
collapseFlowGroups(flow: CodeFlow, collapsed: ReadonlySet<string>): CodeFlow
```

**方針**

- グループ境界を集める `collectFlowGroups` と、表示時に辺の端点を代表ノードへ写す `collapseFlowGroups` を追加する。

#### 新規型 `CodeFlowGroup`

**属性・型**

```text
CodeFlowGroup { id: string; kind: 'loop' | 'try'; label: string; nodeIds: string[]; entryNodeIds: string[]; exitNodeIds: string[] }
```

**方針**

- `CodeFlowGroupSchema` は ID・種別・子ノード・出入り口。

#### 新規型 `CodeFlowLimit`

**属性・型**

```text
CodeFlowLimit { maxNodes: number }
```

**方針**

- `CodeFlowLimitSchema` は最大ノード数の設定を表す。

**処理・互換性の補足** ビルド時点でグループ境界と外部につながるノードを保持し、viewer は折りたたんだグループの辺を代表ノードへ張り替える。上限を超えた場合は省略件数を表示する。

**変更コード案**

```ts
// report/schemas.ts + codeFlow.ts
const CodeFlowGroupSchema = z.object({
    id: z.string(),
    kind: z.enum(['loop', 'try']),
    label: z.string(),
    nodeIds: z.array(z.string()),
    entryNodeIds: z.array(z.string()),
    exitNodeIds: z.array(z.string()),
});
const CodeFlowLimitSchema = z.object({ maxNodes: z.number().int().positive() });
// 生成した境界を viewer のグループ化と省略時の診断で共有する。
```

**確認ケース** ループと try を閉じた状態・開いた状態で入口、出口、例外経路の連結を確認する。

<a id="implementation-detail-77"></a>

## 77. `lwc.eventFlow` の線を足す

**解決したい問題** 親の wire データが子の @api record に届き、ボタンが Account 一覧へ遷移する流れを図に載せたい。

**現行コード** flowOfBundle はイベントや this 参照を収集する。テンプレート値→wire、親属性→子の公開プロパティ、遷移先といった関係の型が足りない。

**主な修正先** [`src/analyzer/report/lwcEventFlow.ts`](../../src/analyzer/report/lwcEventFlow.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)、[`src/analyzer/processor/Lwc/calls.ts`](../../src/analyzer/processor/Lwc/calls.ts)

**コード修正案** テンプレートのバインド名と JS プロパティを照合し、子は解析済み @api に限定する。ナビゲーションの静的値を edge とノードへ追加する。

### 関数・型の変更一覧

#### 既存関数 `flowOfBundle`

**引数・戻り値**

```text
flowOfBundle(bundle: Bundle): BundleFlow
```

**方針**

- `flowOfBundle` と `getLwcEventFlow` はテンプレート属性、子の @api、静的に解決したナビゲーションを既存ノードと結び付ける。

#### 既存関数 `getLwcEventFlow`

**引数・戻り値**

```text
getLwcEventFlow(input: SnapshotInput, filter?: LwcEventFlowFilter): EventFlow
```

**方針**

- `flowOfBundle` と `getLwcEventFlow` はテンプレート属性、子の @api、静的に解決したナビゲーションを既存ノードと結び付ける。

#### 既存型 `EventFlowEdge`

**属性・型**

```text
EventFlowEdge =
    | { from: string; to: string; kind: 'flow' | 'data' | 'event'; label?: string }
    | AdditionalEventEdge
```

**方針**

- `EventFlowEdgeSchema` と必要なノード属性に追加種別を設定する。
- 現在の edge kind を読み込める状態を維持する。

#### 新規関数 `wireUseEdges`

**引数・戻り値**

```text
wireUseEdges(bundle: BundleFlow): AdditionalEventEdge[]
```

**方針**

- `wireUseEdges`、`publicPropertyEdges`、`navigationEdges` は各解析結果から、条件を満たす有向辺だけを作る。

#### 新規関数 `publicPropertyEdges`

**引数・戻り値**

```text
publicPropertyEdges(parent: BundleFlow, child: BundleFlow): AdditionalEventEdge[]
```

**方針**

- `wireUseEdges`、`publicPropertyEdges`、`navigationEdges` は各解析結果から、条件を満たす有向辺だけを作る。

#### 新規関数 `navigationEdges`

**引数・戻り値**

```text
navigationEdges(bundle: BundleFlow): AdditionalEventEdge[]
```

**方針**

- `wireUseEdges`、`publicPropertyEdges`、`navigationEdges` は各解析結果から、条件を満たす有向辺だけを作る。

#### 新規型 `AdditionalEventEdge`

**属性・型**

```text
AdditionalEventEdge = { kind: 'wireUse'; from: string; to: string; property: string } | { kind: 'publicProperty'; from: string; to: string; attribute: string } | { kind: 'navigateTo'; from: string; to: string; pageType: string; objectApiName?: string }
```

**方針**

- `AdditionalEventEdge` は wireUse/publicProperty/navigateTo の payload を区別する。
- 公開型は既存の辺スキーマへ合成する。

**処理・互換性の補足** wire の結果名からテンプレート式の利用箇所を引き、親の属性値と子の @api 定義を接続する。ナビゲーションは静的に読める pageType と objectApiName をノードに持たせる。

**変更コード案**

```ts
// report/lwcEventFlow.ts + schemas.ts
type AdditionalEventEdge =
    | { kind: 'wireUse'; from: string; to: string; property: string }
    | { kind: 'publicProperty'; from: string; to: string; attribute: string }
    | { kind: 'navigateTo'; from: string; to: string; pageType: string; objectApiName?: string };
// ノードIDはコンポーネント名とプロパティ／位置を組み合わせて割り当てる。
```

**確認ケース** 2つの子コンポーネント、複数wire、静的・動的な遷移先を含む例で辺を確認する。

<a id="implementation-detail-78"></a>

## 78. 処理フロー・流れの図の比べる時点

**解決したい問題** 条件式だけが変わったとき、前後比較のフロー図で該当する箱を強調したい。

**現行コード** コードフローのノードIDは組立順で n1 のように割り当てられる。前に文が追加されるだけで後続IDがずれ、同じIDで比較すると誤判定する。

**主な修正先** [`src/analyzer/report/apexFlow.ts`](../../src/analyzer/report/apexFlow.ts)、[`src/analyzer/report/lwcFlow.ts`](../../src/analyzer/report/lwcFlow.ts)、[`src/analyzer/report/lwcEventFlow.ts`](../../src/analyzer/report/lwcEventFlow.ts)、[`src/analyzer/report/apexCallFlow.ts`](../../src/analyzer/report/apexCallFlow.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/viewer/report/components/codeFlowchart.tsx`](../../src/viewer/report/components/codeFlowchart.tsx)、[`src/viewer/report/components/eventFlow.tsx`](../../src/viewer/report/components/eventFlow.tsx)、[`src/viewer/report/components/sequenceDiagram.tsx`](../../src/viewer/report/components/sequenceDiagram.tsx)

**コード修正案** 表示IDとは別に宣言・構造・ソースから比較キーを作る。前後の対応を決めてから内容を比較し、追加・削除・変更の状態をスキーマと viewer に渡す。

### 関数・型の変更一覧

#### 既存関数 `getApexMethodFlows`

**引数・戻り値**

```text
getApexMethodFlows(input: SnapshotInput, filter?: ApexFlowFilter): CodeFlow[]
```

**方針**

- `getApexMethodFlows`／`getLwcMethodFlows` 等は前後を比較パスで整列し、`CodeFlowchartView` などの表示が変更状態を使う。

#### 既存関数 `getLwcMethodFlows`

**引数・戻り値**

```text
getLwcMethodFlows(input: SnapshotInput, filter?: LwcFlowFilter): CodeFlow[]
```

**方針**

- `getApexMethodFlows`／`getLwcMethodFlows` 等は前後を比較パスで整列し、`CodeFlowchartView` などの表示が変更状態を使う。

#### 既存型 `CodeFlowNode`

**属性・型**

```text
CodeFlowNode { status?: ViewStatus }
```

**方針**

- 該当するノードスキーマに任意の status を追加する。
- 表示用IDは比較キーと分ける。

#### 既存型 `EventFlowNode`

**属性・型**

```text
EventFlowNode { status?: ViewStatus }
```

**方針**

- 該当するノードスキーマに任意の status を追加する。

#### 新規関数 `matchFlowNodes`

**引数・戻り値**

```text
matchFlowNodes(before: readonly ComparableFlowNode[], after: readonly ComparableFlowNode[]): ReadonlyMap<string, string>
```

**方針**

- `matchFlowNodes(before, after)` は構造上の対応を求め、`nodeStatus(before, after)` が差分状態を判定する。

#### 新規関数 `nodeStatus`

**引数・戻り値**

```text
nodeStatus(before: ComparableFlowNode | undefined, after: ComparableFlowNode | undefined): ViewStatus
```

**方針**

- `matchFlowNodes(before, after)` は構造上の対応を求め、`nodeStatus(before, after)` が差分状態を判定する。

#### 新規型 `ComparableFlowNode`

**属性・型**

```text
ComparableFlowNode { key: string; kind: string; content: string }
```

**方針**

- `ComparableFlowNode` は比較用の安定キーと比べる内容。
- 状態 union は既存 `ViewStatus` 相当を再利用する。

**処理・互換性の補足** 前後のノードを同じ起点、構造上の役割、安定した位置情報で対応付ける。位置だけがずれた場合と内容が変わった場合を区別し、追加・変更・削除をビューへ渡す。

**変更コード案**

```ts
// report/codeFlow.ts + schemas.ts
type NodeChange = 'added' | 'removed' | 'changed' | 'unchanged';
function nodeStatus(before: ComparableFlowNode | undefined, after: ComparableFlowNode | undefined): NodeChange {
    if (!before) return 'added';
    if (!after) return 'removed';
    return before.kind === after.kind && before.content === after.content ? 'unchanged' : 'changed';
}
// 照合は比較前に起点と構造キーで行い、表示用 n1 等を比較のキーに使わない。
```

**確認ケース** 冒頭への行追加、ノード一件の文言変更、分岐削除で色がずれないことを確認する。

<a id="implementation-detail-79"></a>

## 79. Visualforce・Aura の処理フロー

**解決したい問題** Aura の helper.js や Visualforce コントローラーをレビューするとき、処理の分岐を同じ形式の図で見たい。

**現行コード** getApexMethodFlows は Apex 単位、getLwcMethodFlows は LWC バンドルを入力にする。Aura/Visualforceの単位から対象本体を解決する入口がない。

**主な修正先** [`src/analyzer/report/apexFlow.ts`](../../src/analyzer/report/apexFlow.ts)、[`src/analyzer/report/lwcFlow.ts`](../../src/analyzer/report/lwcFlow.ts)、[`src/analyzer/report/codeFlow.ts`](../../src/analyzer/report/codeFlow.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Metadata/markup.ts`](../../src/analyzer/processor/Metadata/markup.ts)、[`src/report/domainTemplates.ts`](../../src/report/domainTemplates.ts)

**新規パス候補** `src/analyzer/report/markupFlow.ts`

**コード修正案** Visualforce は markup から解決したクラスを Apex フィルターへ変換する。Aura は controller/helper の JS 関数を抽出し、LWCに依存しないJS分類器を経由する。

### 関数・型の変更一覧

#### 既存関数 `getApexMethodFlows`

**引数・戻り値**

```text
getApexMethodFlows(input: SnapshotInput, filter?: ApexFlowFilter): CodeFlow[]
```

**方針**

- `getApexMethodFlows` の対象選択を Visualforce コントローラーの情報から使用する。
- LWC の分類器は必要なJS文脈を分離して Aura のJSでも使えるようにする。

#### 既存関数 `lwcFlow.classifierOf`

**引数・戻り値**

```text
lwcFlow.classifierOf(bundle: Bundle, module: LwcModuleJson): StatementClassifier<LwcJsStatementJson>
```

**方針**

- LWC の分類器は必要なJS文脈を分離して Aura のJSでも使えるようにする。

#### 既存型 `CodeFlow`

**属性・型**

```text
CodeFlow { origin?: MarkupFlowTarget }
```

**方針**

- `CodeFlowSchema` はApex・JSの既存表現を優先し、追加の出自を保持する場合だけ任意の起点情報を加える。

#### 新規関数 `flowForMarkup`

**引数・戻り値**

```text
flowForMarkup(input: SnapshotInput, target: MarkupFlowTarget): CodeFlow[]
```

**方針**

- `flowForMarkup(input, target)` は Aura の本体選択または Visualforce の Apex フィルターへ振り分ける。

#### 新規関数 `getAuraFunctionFlow`

**引数・戻り値**

```text
getAuraFunctionFlow(input: SnapshotInput, target: Extract<MarkupFlowTarget, { kind: 'aura' }>): CodeFlow[]
```

**方針**

- `getAuraFunctionFlow` は抽出したJS本体を共通生成器へ渡す。

#### 新規型 `MarkupFlowTarget`

**属性・型**

```text
MarkupFlowTarget = { kind: 'aura'; bundle: string; file: 'controller' | 'helper'; functionName: string } | { kind: 'visualforce'; page: string; controller: string; methodSignature: string }
```

**方針**

- `MarkupFlowTarget` は Aura(bundle、controller/helper、関数名) と Visualforce(page、controller、署名) の共用体。

**処理・互換性の補足** Aura は bundle の controller/helper から関数本体を列挙する。Visualforce は解決済みコントローラーを Apex provider と同じフロー生成器へ渡し、ページやbundleから対象を選べるようにする。

**変更コード案**

```ts
// report/markupFlow.ts
type MarkupFlowTarget =
    | { kind: 'aura'; bundle: string; file: 'controller' | 'helper'; functionName: string }
    | { kind: 'visualforce'; page: string; controller: string; methodSignature: string };
function flowForMarkup(input: SnapshotInput, target: MarkupFlowTarget) {
    if (target.kind === 'aura') return getAuraFunctionFlow(input, target);
    return getApexMethodFlows(input, apexFilterFor(target));
}
// apexFilterFor は現行 ApexFlowFilter のクラス・メンバー条件へ変換する。
```

**確認ケース** コントローラーにアクセスできる例、未解決の参照、Aura の同名関数で出力を確認する。

<a id="implementation-detail-80"></a>

## 80. LWC の置き場所を広げる

**解決したい問題** 同じ LWC が Lightningページとタブ、クイックアクションに置かれている場合、3箇所を一覧で確認したい。

**現行コード** getLwcPlacements は report/page.ts にあり、既存の配置解析が渡すページ中心の行を使う。タブ・アクションも配置元として拾う必要がある。

**主な修正先** [`src/analyzer/report/page.ts`](../../src/analyzer/report/page.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/analyzer/processor/Metadata/pageAnalysis.ts`](../../src/analyzer/processor/Metadata/pageAnalysis.ts)、[`src/analyzer/types/metadata/recordTypes.ts`](../../src/analyzer/types/metadata/recordTypes.ts)

**コード修正案** Repository または snapshot の対象種別から LWC 名と配置元を抽出し、既存のフィルター前に合流する。既存行のその他属性を必須にせず、種別付きで返す。

### 関数・型の変更一覧

#### 既存関数 `getLwcPlacements`

**引数・戻り値**

```text
getLwcPlacements(input: SnapshotInput, lwc?: string[]): LwcPlacementRow[]
```

**方針**

- `getLwcPlacements` はページ以外にタブとクイックアクションを読み、既存のコンポーネント絞り込みに合流させる。

#### 既存型 `LwcPlacementRow`

**属性・型**

```text
LwcPlacementRow { kind?: 'flexiPage' | 'customTab' | 'quickAction'; unitId?: string }
```

**方針**

- `LwcPlacementRowSchema` に kind と配置元の情報を任意で追加する。
- ページ専用の属性は他の種別で省略できるようにする。

#### 新規関数 `tabPlacementsOf`

**引数・戻り値**

```text
tabPlacementsOf(input: SnapshotInput): AdditionalLwcPlacement[]
```

**方針**

- `tabPlacementsOf` と `quickActionPlacementsOf` は正規化したLWC名と単位IDを返す。

#### 新規関数 `quickActionPlacementsOf`

**引数・戻り値**

```text
quickActionPlacementsOf(input: SnapshotInput): AdditionalLwcPlacement[]
```

**方針**

- `tabPlacementsOf` と `quickActionPlacementsOf` は正規化したLWC名と単位IDを返す。

#### 新規関数 `placementRowsFrom`

**引数・戻り値**

```text
placementRowsFrom(input: SnapshotInput): LwcPlacementRow[]
```

**方針**

- `placementRowsFrom` は既存行へ変換する。

#### 新規型 `AdditionalLwcPlacement`

**属性・型**

```text
AdditionalLwcPlacement = { kind: 'customTab'; unitId: string; component: string } | { kind: 'quickAction'; unitId: string; component: string; object?: string }
```

**方針**

- `AdditionalLwcPlacement` は customTab と quickAction の内部候補型。

**処理・互換性の補足** CustomTab と QuickAction の参照値から LWC の論理名を引き、既存のページ配置と同じ成分の行に変換する。行には配置種別と配置元の単位を入れる。

**変更コード案**

```ts
// report/page.ts + schemas.ts
type AdditionalLwcPlacement =
    | { kind: 'customTab'; unitId: string; component: string }
    | { kind: 'quickAction'; unitId: string; component: string; object?: string };
function placementRowsFrom(input: SnapshotInput): LwcPlacementRow[] {
    return [...tabPlacementsOf(input), ...quickActionPlacementsOf(input)].map(toExistingPlacementRow);
}
// getLwcPlacements の既存結果と合流後、同じ components フィルターを適用する。
```

**確認ケース** Lightningページ、タブ、クイックアクションに同一LWCを置く例で3種の行が出ることを確認する。

<a id="implementation-detail-81"></a>

## 81. ラベルの使用箇所

**解決したい問題** Visualforce の {!$Label.Invoice_Title} による利用を crossRef.labels の一覧へ足す。

**現行コード** getLabelUsages は依存グラフ上で customLabel の辺を集計し、現状はラベルと利用単位の組でまとめる。単位内の複数位置はこの出力にはない。

**主な修正先** [`src/analyzer/processor/Metadata/labelAnalysis.ts`](../../src/analyzer/processor/Metadata/labelAnalysis.ts)、[`src/analyzer/processor/Metadata/markup.ts`](../../src/analyzer/processor/Metadata/markup.ts)、[`src/analyzer/report/crossRef.ts`](../../src/analyzer/report/crossRef.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)

**コード修正案** Visualforce の式から customLabel の参照辺を生成する。位置まで表示する場合は既存の usages を互換に保ち、sourceKeys を持つ箇所配列を追加する。

### 関数・型の変更一覧

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- `analyzeMetadataRefs` の Visualforce 分岐でラベル使用を依存辺へ写し、`getLabelUsages`／`labelsOf` で集計する。

#### 既存関数 `getLabelUsages`

**引数・戻り値**

```text
getLabelUsages(input: ReportInput): LabelUsageRow[]
```

**方針**

- `analyzeMetadataRefs` の Visualforce 分岐でラベル使用を依存辺へ写し、`getLabelUsages`／`labelsOf` で集計する。

#### 既存型 `LabelUsageOrigin`

**属性・型**

```text
LabelUsageOrigin = 'lwc' | 'apex' | 'flow' | 'visualforce'
```

**方針**

- `LabelUsageOrigin` に Visualforce を追加する。

#### 既存型 `LabelUsageRow`

**属性・型**

```text
LabelUsageRow { usages: { origin: string; unit: string; sourceKeys?: ConvertKeys }[] }
```

**方針**

- 位置を公開する場合は `LabelUsageRowSchema` の既存利用単位を保ち、位置だけを任意で加える。

#### 新規関数 `getVisualforceLabelReferences`

**引数・戻り値**

```text
getVisualforceLabelReferences(unit: RefSource): VisualforceLabelReference[]
```

**方針**

- `getVisualforceLabelReferences(unit)` は式からラベルと位置を抽出する。

#### 新規関数 `labelKey`

**引数・戻り値**

```text
labelKey(reference: VisualforceLabelReference): string
```

**方針**

- `labelKey(reference)` は名前空間付きのラベル名を作る。

#### 新規型 `VisualforceLabelReference`

**属性・型**

```text
VisualforceLabelReference { origin: 'visualforce'; label: string; namespace?: string; unitId: string; sourceKeys: ConvertKeys }
```

**方針**

- `VisualforceLabelReference` は origin・ラベル・名前空間・unitId・sourceKeys。

**処理・互換性の補足** Visualforce の式から $Label 参照と名前空間を抽出し、同じラベルの別位置を別の利用箇所として集計する。未解決ラベルには元の式と位置を残す。

**変更コード案**

```ts
// processor/Metadata/labelAnalysis.ts + report/crossRef.ts
type VisualforceLabelReference = {
    origin: 'visualforce';
    label: string;
    namespace?: string;
    unitId: string;
    sourceKeys: ConvertKeys;
};
function labelKey(reference: VisualforceLabelReference): string {
    return reference.namespace ? reference.namespace + '.' + reference.label : reference.label;
}
// バインド式を解釈した結果だけを getLabelUsages の集計へ足す。
```

**確認ケース** 標準と名前空間付きの表記、同一ラベルの複数箇所、ラベル名に似た通常文字列を確認する。
