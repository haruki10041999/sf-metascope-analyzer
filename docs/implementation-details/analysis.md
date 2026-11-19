# 1. 解析（`src/analyzer/parser`・`processor`・`types`）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-14"></a>

## 14. 型の解決

**解決したい問題** Apexで getAccount().Name を書くと、Name が Account の参照として項目利用一覧に現れてほしい。

```apex
public class AccountReader {
    public Account getAccount() {
        return new Account();
    }

    public String nameOfAccount() {
        return getAccount().Name;
    }
}
// 期待する参照先は field:Account.Name。
```

**現行コード** ApexWalkContext は宣言済みの変数型を scopes に持つ。apexVariableOf はその名前を引けるが、呼出し式の戻り値を導く宣言索引は文脈にない。

**主な修正先** [`src/analyzer/processor/Apex/walker.ts`](../../src/analyzer/processor/Apex/walker.ts)、[`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/processor/dependency/apex.ts`](../../src/analyzer/processor/dependency/apex.ts)

**新規パス候補** `src/analyzer/processor/Apex/typeResolution.ts`、`src/analyzer/processor/Apex/standardTypes.ts`

**コード修正案** walker.ts の名前解決を入口にし、式が識別子なら scopes、メンバー式ならレシーバー型からクラス索引、呼出しなら候補の戻り値を引く。戻り値が一致する場合だけ型を返し、dependency/apex.ts の項目参照抽出へ適用する。

### 関数・型の変更一覧

#### 既存関数 `memberAccessRefs`

**引数・戻り値**

```text
memberAccessRefs(context: ApexWalkContext, node: Json): void
```

**方針**

- `dependency/apex.ts` の `memberAccessRefs` は `objectName` が取れない式にも型解決を試み、既存の `add` で `apexTypeMember` の参照を登録する。

#### 既存関数 `apexVariableOf`

**引数・戻り値**

```text
apexVariableOf(context: ApexWalkContext, name: string): ApexVariableType | undefined
```

**方針**

- 既存の局所変数照合を維持する。識別子の初期解決として呼び、局所変数が見つからない場合に継承や式の解決へ進む。

#### 既存型 `ApexWalkContext`

**属性・型**

```text
ApexWalkContext { symbols?: ApexSymbols; scopes: readonly ApexScope[]; className?: string }
```

**方針**

- `ApexWalkContext` に任意の宣言索引を渡せるようにし、`ApexVariableType` の `type` と `collection` は引き続き解決結果として使う。

#### 既存型 `ApexVariableType`

**属性・型**

```text
ApexVariableType { type: string; collection: boolean }
```

**方針**

- 変数型と式の解決結果で同じ型を使う。collection のときは要素型をレシーバーそのものの型として扱わない。

#### 新規関数 `resolveExpressionType`

**引数・戻り値**

```text
resolveExpressionType(expression: unknown, context: ApexWalkContext, symbols: ApexSymbols): ApexVariableType | undefined
```

**方針**

- `resolveExpressionType(expression, context, symbols)` は式の種類に応じて分岐し、`ApexVariableType | undefined` を返す。

#### 新規関数 `resolveIdentifier`

**引数・戻り値**

```text
resolveIdentifier(name: string, context: ResolveContext, symbols: ApexSymbols): ApexVariableType | undefined
```

**方針**

- `resolveIdentifier(name, context, symbols)` は局所変数から継承メンバーへ順に探索し、`typeOfCall(call, context, symbols)` は候補の戻り値型が一致する場合に型を返す。

#### 新規関数 `typeOfCall`

**引数・戻り値**

```text
typeOfCall(call: ApexCallInfo, context: ApexWalkContext, symbols: ApexSymbols): ApexVariableType | undefined
```

**方針**

- `resolveIdentifier(name, context, symbols)` は局所変数から継承メンバーへ順に探索し、`typeOfCall(call, context, symbols)` は候補の戻り値型が一致する場合に型を返す。

#### 新規型 `ResolveContext`

**属性・型**

```text
ResolveContext { className?: string; scopes: readonly ApexScope[] }
```

**方針**

- `ResolveContext` は `ApexWalkContext` から現在のクラスとスコープを取る内部型。

#### 新規型 `ApexSymbols`

**属性・型**

```text
ApexSymbols { findMemberType(owner: string, name: string): ApexVariableType | undefined; methodsFor(owner: string, name: string, caller?: string): readonly ApexMethodSymbol[] }
```

**方針**

- `ApexSymbols` は型と署名を問い合わせる読み取り用インターフェースで、15・17の索引を同じ契約で使う。

**処理・互換性の補足** ApexScope の局所変数を先に調べ、次に宣言クラスとその親のメンバーを探索する。getAccount().Name は呼び出しの戻り値型から Name の所有型を決め、未解決時は既存の参照検出に戻す。型ごとの探索済み集合で継承の循環を止める。

**変更コード案**

```ts
// processor/Apex/typeResolution.ts
type ResolveContext = Pick<ApexWalkContext, 'className' | 'scopes'>;
function resolveIdentifier(name: string, context: ResolveContext, symbols: ApexSymbols) {
    const key = name.toLowerCase();
    for (const scope of [...context.scopes].reverse()) {
        const local = scope.get(key);
        if (local) return local;
    }
    return context.className ? symbols.findMemberType(context.className, key) : undefined;
}
```

**適用箇所のコード案**

```ts
// processor/Apex/typeResolution.ts
function typeOfCall(
    call: ApexCallInfo,
    context: ApexWalkContext,
    symbols: ApexSymbols,
): ApexVariableType | undefined {
    const owner = call.owner ?? context.className;
    if (owner === undefined) return undefined;
    const candidates = symbols.methodsFor(owner, call.method, context.className);
    const types = call.args.map((argument) => resolveExpressionType(argument, context, symbols)?.type);
    const matched = matchingMethods(candidates, types);
    const [first] = matched;
    if (!first?.returnType) return undefined;
    const expected = first.returnType;
    return matched.every(({ returnType }) =>
        returnType?.type === expected.type && returnType.collection === expected.collection
    ) ? expected : undefined;
}
// dependency/apex.ts のメンバー式の visitor
// 設定・Schema の既存分岐を残し、objectName が未定義での早期 return を外す。
if (assignmentTargets.has(node)) return;
const local = objectName === undefined ? undefined : apexVariableOf(context, objectName);
const ownerType = local ?? resolveExpressionType(object, context, symbols);
if (ownerType && !ownerType.collection) {
    add(context, 'apexTypeMember', ownerType.type + '.' + member, 'reads', 'member', keys);
}
```

**確認ケース** 親クラスのメソッドが Account を返す式、同名の局所変数がある式、戻り値を確定できない式で依存辺を確認する。

<a id="implementation-detail-15"></a>

## 15. インターフェース・継承を通した呼び出しの解決

**解決したい問題** Handler 型の h.handle() を図にしたとき、具象クラス EmailHandler と QueueHandler が候補だと分かるようにする。

**現行コード** apexCallFlow.ts の indexOf は型名と Owner.method を引き、Item.target を一件だけ持つ。実装クラスを逆引きするデータがない。

**主な修正先** [`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/report/apexCallFlow.ts`](../../src/analyzer/report/apexCallFlow.ts)

**新規パス候補** `src/analyzer/processor/Apex/projectSymbols.ts`

**コード修正案** projectSymbols.ts で宣言を先に収集し、extends と implements から型の逆引きを作る。calls.ts の解析で単一・候補集合・未解決を返し、シーケンス展開には候補と現在の経路の宣言IDを渡す。

### 関数・型の変更一覧

#### 既存関数 `analyzeApexUnit`

**引数・戻り値**

```text
analyzeApexUnit(unit: ApexUnitParseResult, symbols?: ApexSymbols): ApexUnitInfo
```

**方針**

- `analyzeApexUnit`／`makeApexInfoVisitor` は任意の宣言索引を受け取り、呼出し情報に解決結果を加える。

#### 既存関数 `makeApexInfoVisitor`

**引数・戻り値**

```text
makeApexInfoVisitor(info: ApexUnitInfo, symbols?: ApexSymbols): ApexVisitor
```

**方針**

- `analyzeApexUnit`／`makeApexInfoVisitor` は任意の宣言索引を受け取り、呼出し情報に解決結果を加える。

#### 既存関数 `getApexCallFlows`

**引数・戻り値**

```text
getApexCallFlows(input: SnapshotInput, filter?: ApexCallFlowFilter): CallSequence[]
```

**方針**

- `getApexCallFlows` の索引と展開は宣言IDを使い、複数候補は候補として表示する。

#### 既存型 `ApexCallInfo`

**属性・型**

```text
ApexCallInfo { resolution?: ApexCallResolution }
```

**方針**

- `ApexCallInfo` に任意の `resolution` を追加する。

#### 既存型 `Item`

**属性・型**

```text
Item { resolution?: ApexCallResolution; target?: string }
```

**方針**

- 出力済みのメッセージの target と区別して、展開前の内部項目に解決結果を渡す。単一候補のときに本体をたどり、複数候補は選択肢として保持する。

#### 既存型 `CallSequenceMessage`

**属性・型**

```text
CallSequenceMessage { targetIds?: readonly string[] }
```

**方針**

- `ApexCallInfo` に任意の `resolution` を追加する。

#### 新規関数 `implementationTypesOf`

**引数・戻り値**

```text
implementationTypesOf(base: string, childrenByType: ReadonlyMap<string, readonly TypeSymbol[]>): TypeSymbol[]
```

**方針**

- `implementationTypesOf(base, childrenByType)` は型階層を巡回して具象クラスを返す。

#### 新規関数 `resolveCall`

**引数・戻り値**

```text
resolveCall(call: ApexCallInfo, symbols: ApexSymbols): ApexCallResolution
```

**方針**

- `resolveCall(call, symbols)` は継承元も含めた本体を宣言IDで重複排除して返す。

#### 新規型 `TypeSymbol`

**属性・型**

```text
TypeSymbol { name: string; kind: 'class' | 'interface'; abstract: boolean; parents: readonly string[] }
```

**方針**

- `TypeSymbol` は型名・種類・抽象フラグ・親型を持つ。
- 説明用の `AnalyzedApexCall` は既存型との合成で足りる。

#### 新規型 `ApexMethodSymbol`

**属性・型**

```text
ApexMethodSymbol { id: string; owner: string; signature: string; parameterTypes: readonly string[]; returnType?: ApexVariableType; sourceKeys: ConvertKeys }
```

**方針**

- `ApexMethodSymbol` は宣言ID・所有型・署名・引数型・戻り値・位置を持つ。

#### 新規型 `ApexCallResolution`

**属性・型**

```text
ApexCallResolution = { kind: 'unresolved' } | { kind: 'exact'; targetId: string } | { kind: 'candidates'; targetIds: readonly string[] }
```

**方針**

- `ApexCallResolution` は unresolved／exact／candidates の判別共用体。

**処理・互換性の補足** 宣言索引を解析時に一度組み立て、レシーバーの宣言型に代入可能な具象型から署名に合う実装を列挙する。継承で同じ本体に到達した候補は宣言IDで重複排除し、図には静的に確定した呼び出しと複数候補の区別を渡す。

**変更コード案**

```ts
// processor/Apex/projectSymbols.ts + calls.ts
type ApexMethodSymbol = {
    id: string;
    owner: string;
    signature: string;
    parameterTypes: readonly string[];
    returnType?: ApexVariableType;
    sourceKeys: ConvertKeys;
};
type ApexCallResolution =
    | { kind: 'unresolved' }
    | { kind: 'exact'; targetId: string }
    | { kind: 'candidates'; targetIds: readonly string[] };
type AnalyzedApexCall = ApexCallInfo & { resolution?: ApexCallResolution };
// apexCallFlow.ts は targetId をキーに本体を引き、同じIDへの再帰を止める。
```

**適用箇所のコード案**

```ts
// processor/Apex/projectSymbols.ts
type TypeSymbol = {
    name: string;
    kind: 'class' | 'interface';
    abstract: boolean;
    parents: readonly string[];
};
function implementationTypesOf(base: string, childrenByType: ReadonlyMap<string, readonly TypeSymbol[]>) {
    const seen = new Set<string>();
    const concrete: TypeSymbol[] = [];
    const queue = [...(childrenByType.get(base) ?? [])];
    for (let i = 0; i < queue.length; i++) {
        const type = queue[i]!;
        if (seen.has(type.name)) continue;
        seen.add(type.name);
        if (type.kind === 'class' && !type.abstract) concrete.push(type);
        queue.push(...(childrenByType.get(type.name) ?? []));
    }
    return concrete;
}
// getApexCallFlows の Item には resolution を持たせ、解決候補は先に表示する。
// 本体を展開するのは exact のときだけとする初期案。複数候補を連続呼出しとして描かない。
```

**確認ケース** インターフェースに2実装がある場合は2候補、親の実装を継承するだけの場合は本体1件になることを確認する。

<a id="implementation-detail-16"></a>

## 16. オーバーロードの区別

**解決したい問題** Service.load(Id) と Service.load(List<Id>) の本体を同じシーケンスに混ぜない。

**現行コード** ApexCallInfo.args は式を保持する一方、apexCallFlow.ts がメンバー本体を格納するキーは Owner.method。呼出先だけを改善しても呼出元の本体が混ざる。

**主な修正先** [`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/report/apexCallFlow.ts`](../../src/analyzer/report/apexCallFlow.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)

**コード修正案** walker.ts のメンバー文脈へ宣言IDを追加してイベントの格納キーを変える。対象選定では呼出しの引数個数を先に照合し、型が分かる引数で候補を減らす。旧メンバー指定は入口で署名候補へ展開する。

### 関数・型の変更一覧

#### 既存関数 `makeApexInfoVisitor`

**引数・戻り値**

```text
makeApexInfoVisitor(info: ApexUnitInfo, symbols?: ApexSymbols): ApexVisitor
```

**方針**

- `makeApexInfoVisitor` は引数型を推定し、`getApexCallFlows` の `indexOf` は呼出元・呼出先とも署名付き宣言IDを使用する。
- 旧来のメンバー名フィルターは入口で候補へ変換する。

#### 既存関数 `indexOf`

**引数・戻り値**

```text
indexOf(snapshot: MetadataSnapshot): MemberIndex
```

**方針**

- `makeApexInfoVisitor` は引数型を推定し、`getApexCallFlows` の `indexOf` は呼出元・呼出先とも署名付き宣言IDを使用する。

#### 既存関数 `getApexCallFlows`

**引数・戻り値**

```text
getApexCallFlows(input: SnapshotInput, filter?: ApexCallFlowFilter): CallSequence[]
```

**方針**

- `makeApexInfoVisitor` は引数型を推定し、`getApexCallFlows` の `indexOf` は呼出元・呼出先とも署名付き宣言IDを使用する。

#### 既存型 `ApexCallInfo`

**属性・型**

```text
ApexCallInfo { argumentTypes?: readonly (string | undefined)[] }
```

**方針**

- `ApexCallInfo` に推定引数型の配列、`ApexInfoContext` に任意の宣言IDを追加する。
- `ApexMethodSymbol` の `parameterTypes` を候補照合に使う。

#### 既存型 `ApexInfoContext`

**属性・型**

```text
ApexInfoContext { member?: string; memberId?: string }
```

**方針**

- `ApexCallInfo` に推定引数型の配列、`ApexInfoContext` に任意の宣言IDを追加する。

#### 新規関数 `matchingMethods`

**引数・戻り値**

```text
matchingMethods(methods: readonly ApexMethodSymbol[], argumentTypes: readonly (string | undefined)[]): ApexMethodSymbol[]
```

**方針**

- `matchingMethods(methods, argumentTypes)` は個数、型互換性、完全一致の順に候補を絞る。

#### 新規関数 `isAssignable`

**引数・戻り値**

```text
isAssignable(actual: string, expected: string): boolean
```

**方針**

- `isAssignable(actual, expected)` は確定できる型関係だけを評価する。

#### 新規型なし

**方針**

- 専用の公開型は追加しない。未知の引数型は `string | undefined`、候補の結果は15の `ApexCallResolution` で表す。

**処理・互換性の補足** メソッド名・引数個数・正規化した型列から署名を作る。型が判明した引数で候補を絞り、完全一致を優先する。未推論・null・変換規則が曖昧な場合は候補が複数残る状態を表現する。

**変更コード案**

```ts
// processor/Apex/calls.ts + report/apexCallFlow.ts
function matchingMethods(
    methods: readonly ApexMethodSymbol[],
    argumentTypes: readonly (string | undefined)[],
): ApexMethodSymbol[] {
    const compatible = methods.filter((method) =>
        method.parameterTypes.length === argumentTypes.length &&
        argumentTypes.every((type, index) =>
            type === undefined || isAssignable(type, method.parameterTypes[index]!)
        )
    );
    const exact = compatible.filter((method) =>
        argumentTypes.every((type, index) => type === method.parameterTypes[index])
    );
    return exact.length ? exact : compatible;
}
// caller のメンバーも Owner.name から宣言の署名IDへ移行する。
```

**確認ケース** 同名で引数個数が違う場合、個数が同じで型が違う場合、引数型を推定できない場合を確認する。

<a id="implementation-detail-17"></a>

## 17. プロジェクトをまたぐ解析

**解決したい問題** トリガーから呼ぶ InvoiceHandler.process と、そのハンドラーを呼ぶテストを、別フォルダにあってもたどれるようにする。

**現行コード** analyzeApexUnit は単位別に結果を返し、レポートと依存解析がそれぞれ必要な関係を組み立てている。プロジェクト単位のメソッド索引が共通化されていない。

**主な修正先** [`src/analyzer/processor/Apex/walker.ts`](../../src/analyzer/processor/Apex/walker.ts)、[`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/processor/dependency/units.ts`](../../src/analyzer/processor/dependency/units.ts)

**新規パス候補** `src/analyzer/processor/Apex/projectSymbols.ts`

**コード修正案** 宣言収集と利用収集を分け、宣言IDをキーに参照元、テスト、トリガー、SObject 操作を蓄積する。公開APIや動的呼出しがあるため、参照ゼロは「リポジトリ内で未検出」として出力する。

### 関数・型の変更一覧

#### 既存関数 `analyzeApexUnit`

**引数・戻り値**

```text
analyzeApexUnit(unit: ApexUnitParseResult, symbols?: ApexSymbols): ApexUnitInfo
```

**方針**

- `analyzeApexUnit` は宣言収集済みの索引を受け取る。

#### 既存関数 `unitInfoOf`

**引数・戻り値**

```text
unitInfoOf(result: ApexUnitParseResult): ApexUnitInfo
```

**方針**

- `report/apex.ts` の `unitInfoOf` を使う箇所は、単体解析キャッシュとリポジトリ全体の解析を区別する。

#### 既存型 `ApexInfoContext`

**属性・型**

```text
ApexInfoContext { memberId?: string }
```

**方針**

- `ApexUnitInfo` は単体結果として維持する。
- 呼出元は `ApexInfoContext` の宣言IDを使用して横断結果と結び付ける。

#### 新規関数 `collectDeclarations`

**引数・戻り値**

```text
collectDeclarations(units: readonly ApexUnitParseResult[]): ApexSymbols
```

**方針**

- `collectDeclarations(units)` が全宣言を集め、`indexUsage(declarations, usage)` が呼出し等を索引化する。

#### 新規関数 `indexUsage`

**引数・戻り値**

```text
indexUsage(declarations: ApexSymbols, usage: readonly ApexUnitInfo[]): ProjectApexIndex
```

**方針**

- `collectDeclarations(units)` が全宣言を集め、`indexUsage(declarations, usage)` が呼出し等を索引化する。

#### 新規関数 `indexProject`

**引数・戻り値**

```text
indexProject(units: readonly ApexUnitParseResult[]): ProjectApexIndex
```

**方針**

- `indexProject(units)` は両段階をまとめて横断索引を返す。

#### 新規型 `ProjectApexIndex`

**属性・型**

```text
ProjectApexIndex { byMethodId: ReadonlyMap<string, ApexMethodSymbol>; callersByMethodId: ReadonlyMap<string, readonly ApexCallInfo[]>; testsByMethodId: ReadonlyMap<string, readonly string[]>; handlerIdsByTrigger: ReadonlyMap<string, readonly string[]>; objectUsage: ReadonlyMap<string, readonly (ApexDmlInfo | ApexQueryInfo)[]> }
```

**方針**

- `ProjectApexIndex` は宣言ID→宣言、宣言ID→呼出元・テスト、トリガー→ハンドラー、対象オブジェクト→DML/クエリを保持する。

**処理・互換性の補足** 先に全ファイルの宣言を登録し、次の走査で呼出元ID、SObject使用種別、トリガーのハンドラー呼出し、テストから本番側への参照を記録する。未使用は索引内で参照が見つからない候補として根拠を添える。

**変更コード案**

```ts
// processor/Apex/projectSymbols.ts
type ProjectApexIndex = {
    byMethodId: ReadonlyMap<string, ApexMethodSymbol>;
    callersByMethodId: ReadonlyMap<string, readonly ApexCallInfo[]>;
    testsByMethodId: ReadonlyMap<string, readonly string[]>;
    handlerIdsByTrigger: ReadonlyMap<string, readonly string[]>;
    objectUsage: ReadonlyMap<string, readonly (ApexDmlInfo | ApexQueryInfo)[]>;
};
function indexProject(units: readonly ApexUnitParseResult[]): ProjectApexIndex {
    const declarations = collectDeclarations(units);
    const usage = units.map((unit) => analyzeApexUnit(unit, declarations));
    return indexUsage(declarations, usage);
}
```

**確認ケース** 単位の読み込み順を逆にしても同じ関係が出ることと、テスト専用の呼出元を区別できることを確認する。

<a id="implementation-detail-18"></a>

## 18. JSON にあるが使っていない情報

**解決したい問題** LWC の @wire が参照する Apex メソッドについて cacheable の設定を確認し、REST 公開や SeeAllData も一覧で把握したい。

**現行コード** apex.outline や Apex JSON から宣言の情報を取得できるが、宣言属性と LWC の利用方法を同一行で照合する処理はない。

**主な修正先** [`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)、[`src/analyzer/report/apex.ts`](../../src/analyzer/report/apex.ts)、[`src/analyzer/report/lwc.ts`](../../src/analyzer/report/lwc.ts)、[`src/analyzer/report/crossRef.ts`](../../src/analyzer/report/crossRef.ts)

**コード修正案** Apex の修飾子と引数を宣言IDごとに読む。LWC 側は import と wire を結び、対象メソッドが一意の場合に属性を付加する。WITH SECURITY_ENFORCED のようなクエリ属性は宣言属性と別に扱う。

### 関数・型の変更一覧

#### 既存関数 `getApexOutline`

**引数・戻り値**

```text
getApexOutline(input: SnapshotInput, filter?: ApexFilter & { includeTests?: boolean }): ApexOutlineRow[]
```

**方針**

- `getApexOutline` または `getApexInterface` の行生成で宣言属性を取り出す。
- `analyzeLwcBundles` の情報から import と wire の利用を集め、識別できるApex署名へ結び付ける。

#### 既存型 `ApexOutlineRow`

**属性・型**

```text
ApexOutlineRow { attributes?: ApexDeclarationAttributes }
```

**方針**

- Apexの既存行は追加する宣言属性を任意にし、従来の識別列を保つ。

#### 既存型 `ApexQueryInfo`

**属性・型**

```text
ApexQueryInfo { securityEnforced?: boolean }
```

**方針**

- `ApexQueryInfo` に既知の場合だけ `securityEnforced` を追加する。

#### 新規関数 `readApexDeclarationAttributes`

**引数・戻り値**

```text
readApexDeclarationAttributes(declaration: Record<string, unknown>): ApexDeclarationAttributes
```

**方針**

- `readApexDeclarationAttributes(declaration)` は修飾子の引数を型付き属性に変換する。

#### 新規関数 `joinApexWireUsage`

**引数・戻り値**

```text
joinApexWireUsage(apexIndex: ProjectApexIndex, usages: readonly LwcApexCallRow[]): ApexWireRow[]
```

**方針**

- `joinApexWireUsage(apexIndex, usages)` は一意に解決した呼出先と設定を行にする。

#### 新規型 `ApexDeclarationAttributes`

**属性・型**

```text
ApexDeclarationAttributes { restPath?: string; auraEnabled?: { cacheable: boolean }; testVisible?: boolean; seeAllData?: boolean; futureCallout?: boolean }
```

**方針**

- `ApexDeclarationAttributes` は RESTパス、AuraEnabled、テスト関連、future callout を保持する。

#### 新規型 `ApexWireRow`

**属性・型**

```text
ApexWireRow { component: string; apexMethodId: string; cacheable: boolean | undefined; sourceKeys: ConvertKeys }
```

**方針**

- `ApexWireRow` はコンポーネント名、Apex宣言ID、cacheable の判定値、位置を持つ。

**処理・互換性の補足** 修飾子名と引数を構造化し、Apex import のクラス・メソッドと wire の実ターゲットで cacheable を照合する。REST 公開、テスト可視性、SeeAllData、future callout、クエリ句は該当構文の位置と一緒に行へ出す。

**変更コード案**

```ts
// report/apex.ts
type ApexDeclarationAttributes = {
    restPath?: string;
    auraEnabled?: { cacheable: boolean };
    testVisible?: boolean;
    seeAllData?: boolean;
    futureCallout?: boolean;
};
type ApexWireRow = {
    component: string;
    apexMethodId: string;
    cacheable: boolean | undefined;
    sourceKeys: ConvertKeys;
};
// クエリ由来の句は宣言属性に混ぜず、クエリ行の securityEnforced に写す。
```

**確認ケース** キャッシュ指定がある・ない wire、命令呼出し、テストクラス・メソッドの設定を含む例で各行の根拠を確認する。

<a id="implementation-detail-19"></a>

## 19. 動的な参照

**解決したい問題** Database.query('SELECT Name FROM Account') や rec.get('Field__c') を、固定文字列として判明する範囲で項目利用へ出す。

**現行コード** calls.ts は dynamicQuery 等の呼出種別を認識するが、ApexQueryInfo は動的クエリの対象を原則保持せず、任意式の値の束縛も評価していない。

**主な修正先** [`src/analyzer/processor/Apex/walker.ts`](../../src/analyzer/processor/Apex/walker.ts)、[`src/analyzer/processor/Apex/calls.ts`](../../src/analyzer/processor/Apex/calls.ts)、[`src/analyzer/processor/Apex/interface.ts`](../../src/analyzer/processor/Apex/interface.ts)、[`src/analyzer/processor/dependency/apex.ts`](../../src/analyzer/processor/dependency/apex.ts)

**コード修正案** callTypeOf とレシーバーの型で対象APIを限定し、文字列リテラルと同一スコープ内で再代入のない値を読む。取れたクエリは既存パーサーへ渡し、get/put はオブジェクト型が判明した場合に項目参照へ変換する。

### 関数・型の変更一覧

#### 既存関数 `makeApexInfoVisitor`

**引数・戻り値**

```text
makeApexInfoVisitor(info: ApexUnitInfo): ApexVisitor
```

**方針**

- `makeApexInfoVisitor` の動的クエリ・呼出し分岐は既知APIの引数だけ評価する。
- `dependency/apex.ts` では確定した文字列の解析結果を既存の query・member 参照へ写す。

#### 既存関数 `memberAccessRefs`

**引数・戻り値**

```text
memberAccessRefs(context: ApexWalkContext, node: Json): void
```

**方針**

- `dependency/apex.ts` では確定した文字列の解析結果を既存の query・member 参照へ写す。

#### 既存型 `ApexQueryInfo`

**属性・型**

```text
ApexQueryInfo { objects: string[]; language: 'soql' | 'sosl' | 'dynamic' }
```

**方針**

- `ApexQueryInfo` の `objects` は解析できた動的クエリにも設定し、未知の場合は従来どおり空にする。

#### 既存型 `ApexWalkContext`

**属性・型**

```text
ApexWalkContext { staticStrings?: ReadonlyMap<string, string> }
```

**方針**

- `ApexWalkContext` には静的な値の文脈を渡せるようにする。

#### 新規関数 `staticStringOf`

**引数・戻り値**

```text
staticStringOf(expression: unknown, constants: ReadonlyMap<string, string>): StaticArgument
```

**方針**

- `staticStringOf(expression, constants)` は既知文字列または未知を返す。
- 定数収集は局所宣言と再代入を追い、別スコープの値を混ぜない。

#### 新規型 `StaticArgument`

**属性・型**

```text
StaticArgument = { kind: 'known'; value: string } | { kind: 'unknown' }
```

**方針**

- `StaticArgument` は `known(value)` と `unknown` を区別し、空文字列の既知値を保持する。

**処理・互換性の補足** API所有型とメソッドを照合してから引数を評価する。文字列リテラルまたは更新されていないローカル定数に対象を絞り、Database のクエリ・Schema・レコード get/put・権限名を既存の参照形式へ変換する。

**変更コード案**

```ts
// processor/Apex/calls.ts
type StaticArgument = { kind: 'known'; value: string } | { kind: 'unknown' };
function staticStringOf(expression: unknown, constants: ReadonlyMap<string, string>): StaticArgument {
    const literal = apexStringLiteralOf(expression);
    if (literal !== undefined) return { kind: 'known', value: literal };
    const name = apexIdentifierOf(expression);
    const value = name === undefined ? undefined : constants.get(name.toLowerCase());
    return value === undefined ? { kind: 'unknown' } : { kind: 'known', value };
}
// スコープ離脱・再代入で constants の値を失効させ、既知APIの場合のみ評価する。
```

**確認ケース** リテラルと定数では参照が出て、連結値が決まらない式や同名の自作メソッドでは対象を断定しないことを確認する。

<a id="implementation-detail-20"></a>

## 20. Diff の型

**解決したい問題** トリガー対象条件や修飾子の前後が、差分JSONを読んだときに区別できるようにする。

**現行コード** makeTriggerCasesDiff は makeNodeDiff の内容生成に undefined を返す。modifier の未設定も、値がある変更と同じ観点で辿りにくい。

**主な修正先** [`src/analyzer/processor/Apex/diff/unit.ts`](../../src/analyzer/processor/Apex/diff/unit.ts)、[`src/analyzer/processor/Apex/diff/unitBody.ts`](../../src/analyzer/processor/Apex/diff/unitBody.ts)、[`src/analyzer/processor/Apex/diff/modifier.ts`](../../src/analyzer/processor/Apex/diff/modifier.ts)

**コード修正案** まず triggerCase の同一性と content を分け、同一のケースでも保持している fields が変われば前後を入れる。notSet は値を表す分岐と区別し、annotation 分割は差分利用側を確認したうえで適用する。

### 関数・型の変更一覧

#### 既存関数 `makeTriggerCasesDiff`

**引数・戻り値**

```text
makeTriggerCasesDiff(before: TriggerCaseJson[], after: TriggerCaseJson[], sources?: Sources): TriggerCaseJsonDiff[]
```

**方針**

- `makeTriggerCasesDiff` は `makeNodeDiff` の内容生成で一致ケースの fields を比較する。
- 修飾子の差分生成では未設定と明示値を区別する。

#### 既存型 `TriggerCaseJsonDiff`

**属性・型**

```text
TriggerCaseJsonDiff = ListItemDiff<'triggerCase', TriggerCaseJson, NodeDiff<'triggerCase', TriggerCaseJson, TriggerCaseContent>>
```

**方針**

- `TriggerCaseJsonDiff` の内部 `NodeDiff` に専用 content 型を設定する。
- 修飾子変更の型は既存出力を読める形で未設定を表現する。

#### 新規関数 `triggerCaseFieldsDiff`

**引数・戻り値**

```text
triggerCaseFieldsDiff(before: TriggerCaseJson, after: TriggerCaseJson): TriggerCaseContent | undefined
```

**方針**

- `triggerCaseFieldsDiff(before, after)` はフィールド差分がある場合に前後の配列を返す。
- annotation 専用の変換は利用側の要件が決まった時点で追加する。

#### 新規型 `TriggerCaseContent`

**属性・型**

```text
TriggerCaseContent { fields?: TriggerCaseFields }
```

**方針**

- `TriggerCaseContent` と `TriggerCaseFields` は一致ケース内の前後フィールドを保持する。

#### 新規型 `TriggerCaseFields`

**属性・型**

```text
TriggerCaseFields { before: readonly string[]; after: readonly string[] }
```

**方針**

- `TriggerCaseContent` と `TriggerCaseFields` は一致ケース内の前後フィールドを保持する。

#### 新規型 `ModifierValue`

**属性・型**

```text
ModifierValue<T> = { kind: 'notSet' } | { kind: 'value'; value: T }
```

**方針**

- `ModifierValue<T>` は notSet と実値を区別する。

**処理・互換性の補足** triggerCase を条件キーで揃えてから fields に前後値を持たせる。フィールド欠落、明示値、値変更を共通の change 表現へ写し、annotation の粒度を変更する場合は旧型の利用箇所も調べる。

**変更コード案**

```ts
// processor/Apex/diff/unitBody.ts
type TriggerCaseFields = {
    before: readonly string[];
    after: readonly string[];
};
type TriggerCaseContent = { fields?: TriggerCaseFields };
type ModifierValue<T> =
    | { kind: 'notSet' }
    | { kind: 'value'; value: T };
// TriggerCaseJsonDiff の NodeDiff 第3型引数を undefined から TriggerCaseContent へ変更する。
// makeTriggerCasesDiff は makeNodeDiff の内容コールバックで fields だけの変化も返す。
```

**確認ケース** 条件の追加・削除・変更と notSet から明示値への変更で JSON とスキーマを照合する。

<a id="implementation-detail-21"></a>

## 21. 名前の変更の推定

**解決したい問題** 同じ内容のフロー用項目を OldName__c から NewName__c に変えた場合、削除と追加に加えて対応関係をレビューで見たい。

**現行コード** 共通のリスト差分はキーの一致で要素を照合する。名前が変わると、一致した宣言の前後値ではなく別々の追加・削除になる。

**主な修正先** [`src/analyzer/processor/commons/diff/list.ts`](../../src/analyzer/processor/commons/diff/list.ts)、[`src/analyzer/processor/commons/diff/change.ts`](../../src/analyzer/processor/commons/diff/change.ts)、[`src/analyzer/processor/Apex/diff/declaration.ts`](../../src/analyzer/processor/Apex/diff/declaration.ts)、[`src/analyzer/processor/Metadata/diff/field.ts`](../../src/analyzer/processor/Metadata/diff/field.ts)、[`src/analyzer/report/dependency.ts`](../../src/analyzer/report/dependency.ts)

**コード修正案** 既存の一致処理の後に未対応の同種要素だけを調べ、名前を除いたシグネチャや構造が双方で一意なときに改名候補を出す。依存差分では旧・新IDと変更の根拠を残す。

### 関数・型の変更一覧

#### 既存関数 `makeTypedListDiff`

**引数・戻り値**

```text
makeTypedListDiff<T, D>(before: T[], after: T[], pairings: Pairing[], makeDiff: (before: T, after: T) => D): TypedListDiff<T, D>
```

**方針**

- `makeTypedListDiff` の照合済み要素は維持し、型別の比較で未対応の追加・削除に改名候補を求める。
- 依存差分生成は候補の旧新IDを受け取る。

#### 既存型 `TypedListItemDiff`

**属性・型**

```text
TypedListItemDiff<T, D>:
  追加・削除の分岐 { status: 'added' | 'removed'; index: number; value: Content<T> }
  対応済み分岐 D & { match: Match; index: Index; moved?: MovedFrom }
```

**方針**

- `TypedListItemDiff` の共通 union は維持する初期案とし、候補を使うドメインの結果へ任意の改名情報を追加する。

#### 新規関数 `renameCandidates`

**引数・戻り値**

```text
renameCandidates(removed: readonly DiffItem[], added: readonly DiffItem[]): RenameCandidate[]
```

**方針**

- `renameCandidates(removed, added)` は同じ所有単位・種類の候補を比較し、双方に一つだけ一致する組を返す。

#### 新規関数 `sameStructure`

**引数・戻り値**

```text
sameStructure(before: DiffItem, after: DiffItem): boolean
```

**方針**

- `sameStructure(before, after)` は名前を除く比較規則を型別に適用する。

#### 新規型 `RenameCandidate`

**属性・型**

```text
RenameCandidate { fromId: string; toId: string; evidence: 'sameStructure' }
```

**方針**

- `RenameCandidate` は旧ID・新ID・照合根拠を持つ。

#### 新規型 `DiffItem`

**属性・型**

```text
DiffItem { id: string; owner: string; kind: string; structure: unknown }
```

**方針**

- 候補識別用の `DiffItem` は型別の差分項目からIDと比較項目を取り出した内部型。

**処理・互換性の補足** 削除と追加を同じ所有単位・要素種別に限定して比較する。名前を除いた引数・属性・本体の特徴量で相互に一意な対応だけを採用し、旧新の参照IDを依存差分に渡す。

**変更コード案**

```ts
// processor/commons/diff/change.ts + list.ts
type RenameCandidate = { fromId: string; toId: string; evidence: 'sameStructure' };
function renameCandidates(removed: readonly DiffItem[], added: readonly DiffItem[]) {
    const candidates: RenameCandidate[] = [];
    for (const before of removed) {
        const matches = added.filter((after) => sameStructure(before, after));
        const after = matches[0];
        if (matches.length !== 1 || !after) continue;
        if (removed.filter((item) => sameStructure(item, after)).length !== 1) continue;
        candidates.push({ fromId: before.id, toId: after.id, evidence: 'sameStructure' });
    }
    return candidates;
}
```

**確認ケース** 単純な改名、同時に2件置換された曖昧例、既存参照がない例で差分種別を確認する。

<a id="implementation-detail-22"></a>

## 22. SOSL の別名

**解決したい問題** SOSL の RETURNING 句で TOLABEL(Name) labelName を使ったとき、labelName を JSON と変更履歴から読めるようにする。

**現行コード** sosl.ts は RETURNING 項目を変換する。関数式の直後の alias は項目JSONの出力・比較に反映されていない。

**主な修正先** [`src/analyzer/types/apex/query/sosl.ts`](../../src/analyzer/types/apex/query/sosl.ts)、[`src/analyzer/types/apex/query/select.ts`](../../src/analyzer/types/apex/query/select.ts)、[`src/analyzer/processor/Apex/diff/query/sosl.ts`](../../src/analyzer/processor/Apex/diff/query/sosl.ts)、[`src/analyzer/processor/Apex/diff/query/select.ts`](../../src/analyzer/processor/Apex/diff/query/select.ts)

**コード修正案** 項目変換で alias をオプションとして保持し、対応する差分の照合キーからは除く。変更前後の alias は content として比較し、既存JSONに値がない場合も扱う。

### 関数・型の変更一覧

#### 既存関数 `makeSoslFieldJson`

**引数・戻り値**

```text
makeSoslFieldJson(target: SoslFieldTypeClass): SoslFieldJson
```

**方針**

- `makeSoslFieldJson` は parser の alias を読んで JSONに設定する。

#### 既存関数 `makeSoslFieldDiff`

**引数・戻り値**

```text
makeSoslFieldDiff(before: SoslFieldJson, after: SoslFieldJson, match?: Match): SoslFieldJsonDiff
```

**方針**

- `makeSoslFieldDiff` は式でペアを照合した後、別名の追加・変更・削除を比較する。

#### 既存型 `SoslFieldJson`

**属性・型**

```text
SoslFieldJson { alias?: string }
```

**方針**

- `SoslFieldJson` に任意の `alias: string`、`SoslFieldJsonDiff` の比較対象に alias の前後値を追加する。
- 旧JSONは省略可能なまま扱う。

#### 既存型 `SoslFieldJsonDiff`

**属性・型**

```text
SoslFieldJsonDiff { content?: { alias?: ValueDiff<string> } }
```

**方針**

- `SoslFieldJson` に任意の `alias: string`、`SoslFieldJsonDiff` の比較対象に alias の前後値を追加する。

#### 新規関数 `soslAliasOf`

**引数・戻り値**

```text
soslAliasOf(target: SoslFieldTypeClass): string | undefined
```

**方針**

- 既存の変換・差分関数で処理できる。
- 別名を取得する処理が複数の変換で必要な場合は `soslAliasOf(target)` を内部関数にする。

#### 新規型なし

**方針**

- 専用の公開型は追加しない。SOSL の既存項目型をそのまま拡張するため、例の `ReturningField` は実装前に既存型へ統合する。

**処理・互換性の補足** RETURNING の項目変換で関数呼出しと別名をセットで保持し、差分のキーには式、変更内容には alias を使用する案とする。旧 JSON では alias の省略を許す。

**変更コード案**

```ts
// types/apex/query/sosl.ts + processor/Apex/diff/query/sosl.ts
type ReturningField = {
    expression: QueryFieldExpression;
    alias?: string;
};
function returningFieldOf(expression: QueryFieldExpression, parsedAlias?: string): ReturningField {
    return parsedAlias === undefined ? { expression } : { expression, alias: parsedAlias };
}
// 既存の項目型を拡張する場合は expression のラップを省き、alias だけ追加する。
// 差分の照合キーは expression、変更判定の対象に alias を含める。
```

**確認ケース** TOLABEL(x) の別名追加・変更・削除で、同じ項目の差分として出力されることを確認する。

<a id="implementation-detail-23"></a>

## 23. IR の型の後回しの 5 件

**解決したい問題** TypeScript の rest タプルや型注釈を解析したとき、専用構文の情報が粗い共通ノードに失われるのを避ける。

**現行コード** 変換ビジターと公開IR型は別ファイルにあり、保留事項は docs/ir-types.md にまとまっている。片側だけの変更では出力と利用側の型が揃わない。

**主な修正先** [`src/analyzer/types/lwc_IR/`](../../src/analyzer/types/lwc_IR/)、[`src/analyzer/types/lwc/type.ts`](../../src/analyzer/types/lwc/type.ts)、[`src/analyzer/types/lwc/typeDeclaration.ts`](../../src/analyzer/types/lwc/typeDeclaration.ts)、[`src/analyzer/types/lwc/expression.ts`](../../src/analyzer/types/lwc/expression.ts)、[`src/analyzer/types/lwc/module.ts`](../../src/analyzer/types/lwc/module.ts)、[`src/analyzer/processor/Lwc/diff/`](../../src/analyzer/processor/Lwc/diff/)、[`docs/ir-types.md`](../../docs/ir-types.md)

**コード修正案** 対象構文を一件ずつ選び、ビジターの出力を変えた直後に typeDeclaration などの union、利用側の分岐、golden を更新する。変更対象外の出力を差分で確認する。

### 関数・型の変更一覧

#### 既存関数 `FunctionDeclarationTypeClass.create`

**引数・戻り値**

```text
FunctionDeclarationTypeClass.create(target: FunctionDeclaration, originalSource: string): FunctionDeclarationTypeClass
```

**方針**

- 関数引数は `FunctionDeclarationTypeClass.create`、`ArrowFunctionExpressionTypeClass.create`、`ClassMethodTypeClass.create`。
- JS/TS は parser/Lwc のファイル別変換。

#### 既存関数 `ArrowFunctionExpressionTypeClass.create`

**引数・戻り値**

```text
ArrowFunctionExpressionTypeClass.create(target: ArrowFunctionExpression, originalSource: string): ArrowFunctionExpressionTypeClass
```

**方針**

- 関数引数は `FunctionDeclarationTypeClass.create`、`ArrowFunctionExpressionTypeClass.create`、`ClassMethodTypeClass.create`。

#### 既存関数 `ClassMethodTypeClass.create`

**引数・戻り値**

```text
ClassMethodTypeClass.create(target: ClassMethod, originalSource: string): ClassMethodTypeClass
```

**方針**

- 関数引数は `FunctionDeclarationTypeClass.create`、`ArrowFunctionExpressionTypeClass.create`、`ClassMethodTypeClass.create`。

#### 既存関数 `IdentifierTypeClass.create`

**引数・戻り値**

```text
IdentifierTypeClass.create(target: Identifier, originalSource: string): IdentifierTypeClass
```

**方針**

- 識別子は `IdentifierTypeClass.create` とパターン側。

#### 既存関数 `TSTypeAnnotationTypeClass.create`

**引数・戻り値**

```text
TSTypeAnnotationTypeClass.create(target: TSTypeAnnotation, originalSource: string): TSTypeAnnotationTypeClass
```

**方針**

- 型注釈は `TSTypeAnnotationTypeClass.create` と注釈を持つノード。

#### 既存関数 `TSTupleTypeTypeClass.create`

**引数・戻り値**

```text
TSTupleTypeTypeClass.create(target: TSTupleType, originalSource: string): TSTupleTypeTypeClass
```

**方針**

- タプルとインデックス署名は `TSTupleTypeTypeClass.create` と `TSIndexSignatureTypeClass.create` を構文単位で修正する。

#### 既存関数 `TSIndexSignatureTypeClass.create`

**引数・戻り値**

```text
TSIndexSignatureTypeClass.create(target: TSIndexSignature, originalSource: string): TSIndexSignatureTypeClass
```

**方針**

- タプルとインデックス署名は `TSTupleTypeTypeClass.create` と `TSIndexSignatureTypeClass.create` を構文単位で修正する。

#### 既存型 `IdentifierFields`

**属性・型**

```text
IdentifierFields { kind: 'identifier'; role: TypedIdentifier['kind']; name: string }
```

**方針**

- 関数の params から末尾 rest を分け、`IdentifierFields` を参照・束縛・引数に分ける。
- 型注釈は既存のクラスプロパティと同様に Flow/TS を判別する。

#### 既存型 `TSTupleTypeFields`

**属性・型**

```text
TSTupleTypeFields { elements: readonly TupleElement<TsType>[] }
```

**方針**

- JS用・TS用ノードの許容範囲を分け、`TSTupleTypeFields` の要素順と rest 数、インデックス署名引数の必須型注釈を型・変換双方で扱う。

#### 新規関数 `splitFunctionParameters`

**引数・戻り値**

```text
splitFunctionParameters(params: readonly BabelParameter[]): FunctionParameterList<Param, Rest, ThisParam>
```

**方針**

- 共有実装として `splitFunctionParameters(params)` と `normalizeTypeAnnotation(node)` を追加する案。
- 公開のビジター入口は増やさない。

#### 新規関数 `normalizeTypeAnnotation`

**引数・戻り値**

```text
normalizeTypeAnnotation(node: TypeAnnotation | TSTypeAnnotation): TypeAnnotationRef
```

**方針**

- 共有実装として `splitFunctionParameters(params)` と `normalizeTypeAnnotation(node)` を追加する案。

#### 新規関数 `validateTupleElements`

**引数・戻り値**

```text
validateTupleElements(elements: readonly TupleElement<TsType>[]): void
```

**方針**

- タプルで型だけでは確認できない順序は `validateTupleElements(elements)` で検証し、既存の create から呼ぶ。

#### 新規型 `TypedIdentifier`

**属性・型**

```text
TypedIdentifier { kind: 'reference' | 'binding' | 'argument'; name: string }
```

**方針**

- `TypedIdentifier` は reference／binding／argument、`FunctionParameterList` は通常引数・末尾 rest・任意の thisParam。

#### 新規型 `FunctionParameterList`

**属性・型**

```text
FunctionParameterList<Param, Rest, ThisParam> { params: readonly Param[]; rest: Rest | null; thisParam?: ThisParam }
```

**方針**

- `TypedIdentifier` は reference／binding／argument、`FunctionParameterList` は通常引数・末尾 rest・任意の thisParam。

#### 新規型 `TypeAnnotationRef`

**属性・型**

```text
TypeAnnotationRef = { kind: 'flow'; value: TypeAnnotation } | { kind: 'ts'; value: TSTypeAnnotation }
```

**方針**

- `TypeAnnotationRef` は Flow/TS の判別共用体。

#### 新規型 `TupleElement`

**属性・型**

```text
TupleElement<T> { kind: 'required' | 'optional' | 'rest'; type: T }
```

**方針**

- `TupleElement` は必須・省略可能・rest を区別し、JS/TS のルート型は適切なノードだけを許す。

**処理・互換性の補足** docs/ir-types.md に沿って、引数rest、識別子の3区分、Flow/TS の型注釈、JS/TS のノード、タプルの順に該当ビジターと公開型の両方を小さく変更する。

**変更コード案**

```ts
// types/lwc_IR と types/lwc/typeDeclaration.ts の個別変更案
type FunctionParameterList<Param, Rest, ThisParam> = {
    params: readonly Param[];
    rest: Rest | null;
    thisParam?: ThisParam;
};
type TypedIdentifier =
    | { kind: 'reference'; name: string }
    | { kind: 'binding'; name: string }
    | { kind: 'argument'; name: string };
type TupleElement<TypeNode> =
    | { kind: 'required'; type: TypeNode }
    | { kind: 'optional'; type: TypeNode }
    | { kind: 'rest'; type: TypeNode };
// JS/TS のパーサー側で該当しない型注釈は出力しない。
```

**確認ケース** 各変更で型検査を行い、IR golden の差分が変更対象の構造に限られることを確認する。

<a id="implementation-detail-27"></a>

## 27. テンプレートの式の値の解決

**解決したい問題** lightning-input-field の field-name={nameField} が JS の ACCOUNT_NAME import を指す場合、Account.Name の使用として集計したい。

**現行コード** Lwc/analysis.ts は schemaImportsOf と resolveSchema を持ち、既知の import 参照は処理する。テンプレート式からクラスの別名や初期値にたどる経路が足りない。contentAssetUrl の種別はすでに import.ts にある。

**主な修正先** [`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)、[`src/analyzer/processor/Lwc/walker.ts`](../../src/analyzer/processor/Lwc/walker.ts)、[`src/analyzer/parser/Lwc/template.ts`](../../src/analyzer/parser/Lwc/template.ts)、[`src/analyzer/types/lwc/import.ts`](../../src/analyzer/types/lwc/import.ts)

**コード修正案** 解析済み import を集める段階で静的な別名バインディングを追加し、テンプレート walk の属性を resolveSchema へ渡す。既存の contentAssetUrl 分類は流用し、欠けている分類または依存先への変換だけを補う。

### 関数・型の変更一覧

#### 既存関数 `analyzeLwcBundles`

**引数・戻り値**

```text
analyzeLwcBundles(bundles: LwcBundleParseResult[], objects?: ObjectInfo[]): LwcBundleAnalysis[]
```

**方針**

- `analyzeLwcBundles` でテンプレートを歩くとき、`schemaImportsOf` の結果と静的なクラス初期値を使って属性を解決する。
- `resolveSchema` は既存の文字列や import の解決入口として使う。

#### 既存型 `LwcMetadataDependency`

**属性・型**

```text
LwcMetadataDependency { sourceKeys?: ConvertKeys }
```

**方針**

- `LwcBundleAnalysis` の既存参照出力を使い、`LwcMetadataDependency` には必要な参照種別と利用元の位置だけを追加する。
- 既存の contentAssetUrl 分類を再利用する。

#### 新規関数 `fieldFromBinding`

**引数・戻り値**

```text
fieldFromBinding(binding: FieldBindingInput, initializers: ReadonlyMap<string, string>, imports: ReadonlyMap<string, { object: string; field: string }>): TemplateFieldBinding | undefined
```

**方針**

- `fieldFromBinding(binding, initializers, imports)` は識別子チェーンを循環検出付きでたどり、静的に解決した場合に型付き参照を返す。

#### 新規型 `FieldBindingInput`

**属性・型**

```text
FieldBindingInput { value: string; sourceKeys: ConvertKeys }
```

**方針**

- `FieldBindingInput` は式とテンプレート位置、`TemplateFieldBinding` は式、object/field、元位置を持つ。
- どちらも解析内部の型。

#### 新規型 `TemplateFieldBinding`

**属性・型**

```text
TemplateFieldBinding { attribute: 'field-name'; expression: string; target: { object: string; field: string }; sourceKeys: ConvertKeys }
```

**方針**

- `FieldBindingInput` は式とテンプレート位置、`TemplateFieldBinding` は式、object/field、元位置を持つ。

**処理・互換性の補足** テンプレートの項目属性の式からクラスメンバー初期値・import へたどり、静的に決まる場合だけスキーマ参照へ投影する。モジュール文字列の分類には接頭辞と名前空間を保持する。

**変更コード案**

```ts
// processor/Lwc/analysis.ts
type TemplateFieldBinding = {
    attribute: 'field-name';
    expression: string;
    target: { object: string; field: string };
    sourceKeys: ConvertKeys;
};
function resolveTemplateField(
    binding: UnresolvedTemplateBinding,
    imports: ReadonlyMap<string, SchemaImport>,
    aliases: ReadonlyMap<string, string>,
): TemplateFieldBinding | undefined {
    const name = aliases.get(binding.expression) ?? binding.expression;
    const target = imports.get(name);
    return target && { ...binding, target };
}
```

**適用箇所のコード案**

```ts
// processor/Lwc/analysis.ts
type FieldBindingInput = { value: string; sourceKeys: ConvertKeys };
function fieldFromBinding(
    binding: FieldBindingInput,
    initializers: ReadonlyMap<string, string>,
    imports: ReadonlyMap<string, { object: string; field: string }>,
): TemplateFieldBinding | undefined {
    const seen = new Set<string>();
    let identifier = binding.value;
    while (!seen.has(identifier)) {
        seen.add(identifier);
        const imported = imports.get(identifier);
        if (imported) return {
            attribute: 'field-name',
            expression: binding.value,
            target: imported,
            sourceKeys: binding.sourceKeys,
        };
        const next = initializers.get(identifier);
        if (!next) break;
        identifier = next;
    }
    return undefined;
}
// initializers は単純な識別子への束縛だけを登録し、テンプレート自体の位置を保持する。
```

**確認ケース** field-name の値が Schema import、通常文字列、不明な式の場合と、名前空間付き label の出力を確認する。

<a id="implementation-detail-28"></a>

## 28. TS の型の名前をバンドルをまたいで解決

**解決したい問題** 共通ユーティリティの export type Customer を、別のLWCが import type { Customer as Row } としたとき Row を解決したい。

**現行コード** LWC の型出力には型名や import の情報があるが、analyzeLwcBundles の参照処理にモジュール間の公開型を解く索引がない。

**主な修正先** [`src/analyzer/processor/Lwc/analysis.ts`](../../src/analyzer/processor/Lwc/analysis.ts)、[`src/analyzer/processor/Lwc/walker.ts`](../../src/analyzer/processor/Lwc/walker.ts)、[`src/analyzer/processor/Lwc/interface.ts`](../../src/analyzer/processor/Lwc/interface.ts)、[`src/analyzer/types/lwc/type.ts`](../../src/analyzer/types/lwc/type.ts)、[`src/analyzer/types/lwc/typeDeclaration.ts`](../../src/analyzer/types/lwc/typeDeclaration.ts)

**新規パス候補** `src/analyzer/processor/Lwc/typeResolution.ts`

**コード修正案** モジュールIDと export 名の組で索引を作る。バンドルローカル、import、再 export の順で辿り、訪問済みの組を検出する。初期値推論は型注釈がなく、値が確定する場合に限る。

### 関数・型の変更一覧

#### 既存関数 `analyzeLwcBundles`

**引数・戻り値**

```text
analyzeLwcBundles(bundles: LwcBundleParseResult[], objects?: ObjectInfo[]): LwcBundleAnalysis[]
```

**方針**

- `analyzeLwcBundles` は必要な場合に公開型の索引を作り、型付きのメンバーを処理する箇所へ渡す。
- 既存の保存IRは解析結果だけで推定できる範囲を優先する。

#### 既存型 `LwcBundleAnalysis`

**属性・型**

```text
LwcBundleAnalysis { resolvedTypes?: ReadonlyMap<string, BundleTypeResolution> }
```

**方針**

- 型名参照の既存ノードに項目原文を保持する。
- 解析結果へ任意の解決情報を加え、未解決を型エラーとして扱わない。

#### 新規関数 `resolveExport`

**引数・戻り値**

```text
resolveExport(key: TypeExportKey, index: BundleTypeIndex, seen?: Set<string>): BundleTypeResolution
```

**方針**

- `resolveExport(key, index, seen)` は export と再export をたどる。

#### 新規関数 `inferInitializerType`

**引数・戻り値**

```text
inferInitializerType(initializer: unknown, index: BundleTypeIndex): BundleTypeResolution
```

**方針**

- `inferInitializerType(initializer, index)` は型注釈のない宣言の静的初期値を型に変換する。

#### 新規型 `TypeExportKey`

**属性・型**

```text
TypeExportKey { module: string; exportedName: string }
```

**方針**

- `TypeExportKey` はモジュールと公開名の組。

#### 新規型 `BundleTypeIndex`

**属性・型**

```text
BundleTypeIndex = ReadonlyMap<string, { kind: 'declaration'; node: LwcDeclaredType } | { kind: 'alias'; target: TypeExportKey }>
```

**方針**

- `BundleTypeIndex` は宣言または転送先の索引、`BundleTypeResolution` は resolved と missing／cycle／external を持つ unresolved を区別する。

#### 新規型 `BundleTypeResolution`

**属性・型**

```text
BundleTypeResolution = { kind: 'resolved'; node: LwcDeclaredType } | { kind: 'unresolved'; reason: 'missing' | 'cycle' | 'external' }
```

**方針**

- `BundleTypeIndex` は宣言または転送先の索引、`BundleTypeResolution` は resolved と missing／cycle／external を持つ unresolved を区別する。

**処理・互換性の補足** バンドルの module export をキーに型宣言を登録し、ローカルの型参照から import 名、再エクスポート先の順で解決する。探索済み集合を使い、外部・循環・不明な初期値は未解決理由を扱える形にする。

**変更コード案**

```ts
// processor/Lwc/typeResolution.ts
type TypeExportKey = { module: string; exportedName: string };
type BundleTypeResolution =
    | { kind: 'resolved'; node: LwcDeclaredType }
    | { kind: 'unresolved'; reason: 'missing' | 'cycle' | 'external' };
function resolveExport(key: TypeExportKey, index: BundleTypeIndex, seen = new Set<string>()): BundleTypeResolution {
    const id = JSON.stringify([key.module, key.exportedName]);
    if (seen.has(id)) return { kind: 'unresolved', reason: 'cycle' };
    const entry = index.get(id);
    if (!entry) return { kind: 'unresolved', reason: 'missing' };
    if (entry.kind === 'declaration') return { kind: 'resolved', node: entry.node };
    return resolveExport(entry.target, index, new Set([...seen, id]));
}
```

**確認ケース** 別バンドルからの別名 import、型注釈なしのリテラル初期値、循環 import を確認する。

<a id="implementation-detail-29"></a>

## 29. Aura の参照

**解決したい問題** Aura コンポーネントの controller.js が component.get('c.load') を呼んだり、未定義の handler を markup から参照したりする箇所を知りたい。

**現行コード** Metadata の markup.ts はタグやマージ式を抽出する。Aura JS の API 参照とマークアップ側の定義を同じ bundle 文脈で照合する段階がない。

**主な修正先** [`src/analyzer/parser/Metadata/folders.ts`](../../src/analyzer/parser/Metadata/folders.ts)、[`src/analyzer/parser/Metadata/folder.ts`](../../src/analyzer/parser/Metadata/folder.ts)、[`src/analyzer/processor/Metadata/markup.ts`](../../src/analyzer/processor/Metadata/markup.ts)、[`src/analyzer/processor/Metadata/analysis.ts`](../../src/analyzer/processor/Metadata/analysis.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)

**新規パス候補** `src/analyzer/processor/Metadata/auraScript.ts`

**コード修正案** bundle 読み取りで controller/helper を解析に渡す。JS と markup を共通の候補型へ変換し、同一 bundle の定義表から action、attribute、event に応じて解決する。

### 関数・型の変更一覧

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- メタデータの bundle 読み取りと `analyzeMetadataRefs` に controller/helper の解析結果を渡す分岐を追加する。
- markup の既存抽出は同一 bundle の action、attribute、event 定義と照合する。

#### 既存型 `MetadataRefInfo`

**属性・型**

```text
MetadataRefInfo { refType: DependencyTargetType; statement?: ConvertKeys; expression?: ConvertKeys }
```

**方針**

- `MetadataRefInfo` の既存位置フィールドを再利用し、必要な Aura 参照種別を追加する。
- Aura JS 解析結果は汎用 markup 出力と別の内部情報として渡す。

#### 新規関数 `analyzeAuraScript`

**引数・戻り値**

```text
analyzeAuraScript(source: string, bundleContext: AuraBundleContext): AuraReference[]
```

**方針**

- `analyzeAuraScript(source, bundleContext)` は JS の参照候補を集める。

#### 新規関数 `referenceOfGet`

**引数・戻り値**

```text
referenceOfGet(owner: string, argument: string, sourceKeys: ConvertKeys): AuraReference | undefined
```

**方針**

- `referenceOfGet(owner, argument, sourceKeys)` は既知の Aura API の定数呼出しを候補へ変換する。

#### 新規型 `AuraReference`

**属性・型**

```text
AuraReference { kind: 'action' | 'event' | 'attribute'; name: string; sourceKeys: ConvertKeys }
```

**方針**

- `AuraReference` は action／event／attribute、名前、位置を持つ。

#### 新規型 `AuraBundleContext`

**属性・型**

```text
AuraBundleContext { actions: ReadonlySet<string>; attributes: ReadonlySet<string>; events: ReadonlySet<string> }
```

**方針**

- `AuraBundleContext` は bundle 内の関数・属性・イベントの宣言索引を持つ。

**処理・互換性の補足** Aura bundle の controller/helper JS を既存の JS 構文表現で読み、component.get と $A.get の定数引数を収集する。aura:handler と {!v.x}、{!c.handle} は同一束内の属性・関数定義に照合する。

**変更コード案**

```ts
// processor/Metadata/auraScript.ts + markup.ts
type AuraReference = {
    kind: 'action' | 'event' | 'attribute';
    name: string;
    sourceKeys: ConvertKeys;
};
function referenceOfGet(owner: string, argument: string, sourceKeys: ConvertKeys): AuraReference | undefined {
    if (owner === 'component' && argument.startsWith('c.')) {
        return { kind: 'action', name: argument.slice(2), sourceKeys };
    }
    if (owner === '$A' && argument.startsWith('e.')) {
        return { kind: 'event', name: argument.slice(2), sourceKeys };
    }
}
// 実際の分類では owner が Aura API へ解決できることも確認する。
```

**確認ケース** 存在する属性・アクション、未定義ハンドラー、文字列化できない引数で出力を確認する。

<a id="implementation-detail-30"></a>

## 30. Visualforce・Aura の専用の解析

**解決したい問題** Visualforce ページの標準コントローラー、拡張コントローラー、使用部品、{!Account.Name} を、別々の参照として一覧にしたい。

**現行コード** refs.ts の visualforceRefs は既存のコントローラー等の参照を抽出する。metadata.properties の propertiesOf は構造を汎用のパスと値に展開し、利用文脈を分類しない。

**主な修正先** [`src/analyzer/processor/Metadata/markup.ts`](../../src/analyzer/processor/Metadata/markup.ts)、[`src/analyzer/processor/Metadata/analysis.ts`](../../src/analyzer/processor/Metadata/analysis.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)、[`src/analyzer/types/metadata/markup.ts`](../../src/analyzer/types/metadata/markup.ts)、[`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)

**コード修正案** 既存の参照抽出を活かして、markup の走査結果に kind と sourceKeys を付ける。標準コントローラーや明示したルートから項目先を解決し、専用の行変換と依存抽出の両方で結果を使う。

### 関数・型の変更一覧

#### 既存関数 `visualforceRefs`

**引数・戻り値**

```text
visualforceRefs(source: RefSource): MetadataRefInfo[]
```

**方針**

- `visualforceRefs` と `analyzeMetadataRefs` を専用 markup 解析へつなぐ。

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- `visualforceRefs` と `analyzeMetadataRefs` を専用 markup 解析へつなぐ。

#### 既存関数 `getMetadataProperties`

**引数・戻り値**

```text
getMetadataProperties(input: ReportInput, filter?: MetadataFilter & { paths?: string[] }): MetadataPropertyRow[]
```

**方針**

- `getMetadataProperties` では対象を専用の行へ変換する経路を追加する。

#### 既存型 `MetadataPropertyRow`

**属性・型**

```text
MetadataPropertyRow { referenceKind?: MarkupReference['kind']; sourceKeys?: ConvertKeys }
```

**方針**

- `MetadataRefInfo` と既存 properties 行は維持する。
- 専用結果を表示する場合は行に参照種別と位置を任意で付ける。

#### 新規関数 `analyzeMarkup`

**引数・戻り値**

```text
analyzeMarkup(unit: RefSource, context?: MetadataContext): MarkupAnalysis
```

**方針**

- `analyzeMarkup(unit, context)` はタグとバインド式を走査して専用結果を返す。

#### 新規関数 `resolveMarkupBinding`

**引数・戻り値**

```text
resolveMarkupBinding(expression: string, context: MetadataContext): { object: string; field: string } | undefined
```

**方針**

- `resolveMarkupBinding(expression, context)` は標準・拡張コントローラー等の文脈で項目候補を求める。

#### 新規型 `MarkupReference`

**属性・型**

```text
MarkupReference = { kind: 'controller'; name: string; role: 'standard' | 'custom' | 'extension' } | { kind: 'component'; namespace: string; name: string } | { kind: 'binding'; expression: string; target?: { object: string; field: string } }
```

**方針**

- `MarkupReference` は controller／component／binding を区別し、`MarkupAnalysis` は単位IDと位置付き参照リストを保持する。

#### 新規型 `MarkupAnalysis`

**属性・型**

```text
MarkupAnalysis { unitId: string; references: readonly (MarkupReference & { sourceKeys: ConvertKeys })[] }
```

**方針**

- `MarkupReference` は controller／component／binding を区別し、`MarkupAnalysis` は単位IDと位置付き参照リストを保持する。

**処理・互換性の補足** タグ、コントローラー宣言、式を markup.ts で個別に抽出し、種別・参照先・位置の行に写す。Visualforce の Account.Name のような式はコントローラー文脈に基づいて候補を解決する。

**変更コード案**

```ts
// types/metadata/markup.ts + processor/Metadata/markup.ts
type MarkupReference =
    | { kind: 'controller'; name: string; role: 'standard' | 'custom' | 'extension' }
    | { kind: 'component'; namespace: string; name: string }
    | { kind: 'binding'; expression: string; target?: { object: string; field: string } };
type MarkupAnalysis = {
    unitId: string;
    references: readonly (MarkupReference & { sourceKeys: ConvertKeys })[];
};
// analyzeMarkup を参照解析と metadata.properties の専用行変換から呼ぶ。
```

**確認ケース** 標準／拡張コントローラー、カスタム部品、解決できる項目式と動的な式を含む例で確認する。

<a id="implementation-detail-34"></a>

## 34. オブジェクトの参照の穴

**解決したい問題** Invoice__c.Customer__c の lookupFilter が Account.Type を条件に使う場合、Account.Type を変更したとき参照元を確認したい。

**現行コード** field.ts は lookupFilter の読取を実装済み。参照抽出に全属性が渡るわけではなく、保存済みの値が依存辺に現れない箇所がある。

**主な修正先** [`src/analyzer/types/metadata/field.ts`](../../src/analyzer/types/metadata/field.ts)、[`src/analyzer/types/metadata/object.ts`](../../src/analyzer/types/metadata/object.ts)、[`src/analyzer/types/metadata/webLink.ts`](../../src/analyzer/types/metadata/webLink.ts)、[`src/analyzer/processor/Metadata/refs.ts`](../../src/analyzer/processor/Metadata/refs.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)、[`src/analyzer/processor/dependency/formula.ts`](../../src/analyzer/processor/dependency/formula.ts)

**コード修正案** refs.ts で構造化済みの親子関係、積み上げ条件、制御項目、lookupFilter を走査する。検索レイアウト・数式・URLは構文ごとに既存の解決関数へ接続し、元要素の sourceKeys を残す。

### 関数・型の変更一覧

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- `analyzeMetadataRefs` の `EXTRACTORS` と `formulaRefs` を拡張し、既に読まれた lookupFilter、集計関係、制御項目、検索レイアウト・リンクを参照にする。

#### 既存関数 `formulaRefs`

**引数・戻り値**

```text
formulaRefs(source: RefSource): MetadataRefInfo[]
```

**方針**

- `analyzeMetadataRefs` の `EXTRACTORS` と `formulaRefs` を拡張し、既に読まれた lookupFilter、集計関係、制御項目、検索レイアウト・リンクを参照にする。

#### 既存型 `MetadataRefInfo`

**属性・型**

```text
MetadataRefInfo { refType: DependencyTargetType; statement?: ConvertKeys; expression?: ConvertKeys }
```

**方針**

- `CustomFieldJson` 等の既存情報を優先し、抽出元にない値だけ任意で追加する。
- `MetadataRefInfo` の位置と対象名を出力に使う。

#### 新規関数 `referencesForObject`

**引数・戻り値**

```text
referencesForObject(object: ObjectInfo): FieldReferenceSite[]
```

**方針**

- `referencesForObject(object)` は `relationshipSites`、`rollupAndFilterSites`、`layoutAndExpressionSites` の結果を同じ参照形式へまとめる。

#### 新規関数 `relationshipSites`

**引数・戻り値**

```text
relationshipSites(object: ObjectInfo): FieldReferenceSite[]
```

**方針**

- `referencesForObject(object)` は `relationshipSites`、`rollupAndFilterSites`、`layoutAndExpressionSites` の結果を同じ参照形式へまとめる。

#### 新規関数 `rollupAndFilterSites`

**引数・戻り値**

```text
rollupAndFilterSites(object: ObjectInfo): FieldReferenceSite[]
```

**方針**

- `referencesForObject(object)` は `relationshipSites`、`rollupAndFilterSites`、`layoutAndExpressionSites` の結果を同じ参照形式へまとめる。

#### 新規関数 `layoutAndExpressionSites`

**引数・戻り値**

```text
layoutAndExpressionSites(object: ObjectInfo): FieldReferenceSite[]
```

**方針**

- `referencesForObject(object)` は `relationshipSites`、`rollupAndFilterSites`、`layoutAndExpressionSites` の結果を同じ参照形式へまとめる。

#### 新規型 `FieldReferenceSite`

**属性・型**

```text
FieldReferenceSite { kind: 'relationship' | 'rollup' | 'lookupFilter' | 'controllingField' | 'layout' | 'expression'; sourceKeys: ConvertKeys; target: { object: string; field?: string } }
```

**方針**

- `FieldReferenceSite` は関係・集計等の利用種別、元位置、object と任意の field を持つ内部型。
- 公開時は `MetadataRefInfo` に変換する。

**処理・互換性の補足** field の relationship/summary/filter と、object の searchLayouts、Webリンクの定義を参照候補へ変換する。式やURLの抽出結果にはオブジェクト文脈と sourceKeys を添え、同一ターゲットへの別の利用箇所を保持する。

**変更コード案**

```ts
// processor/Metadata/refs.ts
type FieldReferenceSite = {
    kind: 'relationship' | 'rollup' | 'lookupFilter' | 'controllingField' | 'layout' | 'expression';
    sourceKeys: ConvertKeys;
    target: { object: string; field?: string };
};
function referencesForObject(object: ObjectInfo): FieldReferenceSite[] {
    return [
        ...relationshipSites(object),
        ...rollupAndFilterSites(object),
        ...layoutAndExpressionSites(object),
    ];
}
```

**確認ケース** 主従・集計・制御項目で参照元と先を確認し、別オブジェクトの同名項目への誤解決がないことを確認する。

<a id="implementation-detail-35"></a>

## 35. レイアウトの残り

**解決したい問題** レイアウトの summaryLayout の項目を入れ替えたとき、レイアウト詳細で入れ替えを確認できるようにする。

**現行コード** レイアウトの既存詳細は getLayoutDetails が定義済みの節を変換する。customLink 等が型や読取スキーマに含まれないと、表示と差分の両方から値が落ちる。

**主な修正先** [`src/analyzer/types/metadata/layout.ts`](../../src/analyzer/types/metadata/layout.ts)、[`src/analyzer/parser/Metadata/page.ts`](../../src/analyzer/parser/Metadata/page.ts)、[`src/analyzer/processor/Metadata/pageAnalysis.ts`](../../src/analyzer/processor/Metadata/pageAnalysis.ts)、[`src/analyzer/report/page.ts`](../../src/analyzer/report/page.ts)

**コード修正案** layout.ts で節ごとの属性と順序を読取り、pageAnalysis.ts で参照を抽出する。詳細スキーマに節を加え、前後照合は項目の識別名と配置順を使い分ける。

### 関数・型の変更一覧

#### 既存関数 `makeLayoutJson`

**引数・戻り値**

```text
makeLayoutJson(file: ParsedXmlFile, registry: XmlSourceRegistry, problems: XmlReadProblem[]): LayoutJson | null
```

**方針**

- `makeLayoutJson` で追加節を読み、`analyzeLayouts` と `getLayoutDetails` の変換に渡す。
- 節の順序や配置の変化はレイアウトの比較時に反映する。

#### 既存関数 `analyzeLayouts`

**引数・戻り値**

```text
analyzeLayouts(results: LayoutParseResult[], context?: MetadataContext): LayoutAnalysis
```

**方針**

- `makeLayoutJson` で追加節を読み、`analyzeLayouts` と `getLayoutDetails` の変換に渡す。

#### 既存関数 `getLayoutDetails`

**引数・戻り値**

```text
getLayoutDetails(input: SnapshotInput, names?: string[]): LayoutDetail[]
```

**方針**

- `makeLayoutJson` で追加節を読み、`analyzeLayouts` と `getLayoutDetails` の変換に渡す。

#### 既存型 `LayoutJson`

**属性・型**

```text
LayoutJson { additionalSections?: AdditionalLayoutSections }
```

**方針**

- `LayoutJson`、`LayoutInfo`、`LayoutDetailSchema` に customLink、miniLayout、summaryLayout、feedLayout を任意で加える。

#### 既存型 `LayoutInfo`

**属性・型**

```text
LayoutInfo { additionalSections?: AdditionalLayoutSections }
```

**方針**

- `LayoutJson`、`LayoutInfo`、`LayoutDetailSchema` に customLink、miniLayout、summaryLayout、feedLayout を任意で加える。

#### 既存型 `LayoutDetail`

**属性・型**

```text
LayoutDetail { additionalSections?: AdditionalLayoutSections }
```

**方針**

- `LayoutJson`、`LayoutInfo`、`LayoutDetailSchema` に customLink、miniLayout、summaryLayout、feedLayout を任意で加える。

#### 新規関数 `readAdditionalLayoutSections`

**引数・戻り値**

```text
readAdditionalLayoutSections(root: XmlElement, context: { file: XmlFile; registry: XmlSourceRegistry }): AdditionalLayoutSections
```

**方針**

- `readAdditionalLayoutSections(root, context)` は節を読んで位置・順序付きの構造を返す。

#### 新規関数 `layoutSectionReferences`

**引数・戻り値**

```text
layoutSectionReferences(sections: AdditionalLayoutSections): MetadataRefInfo[]
```

**方針**

- `layoutSectionReferences(sections)` は利用項目を既存参照へ写す。

#### 新規型 `LayoutLink`

**属性・型**

```text
LayoutLink { name: string; sourceKeys: ConvertKeys }
```

**方針**

- `AdditionalLayoutSections`、`LayoutLink`、`LayoutSectionFields` は追加節の値と位置を保持する。

#### 新規型 `LayoutSectionFields`

**属性・型**

```text
LayoutSectionFields { fields: readonly string[]; sourceKeys: ConvertKeys }
```

**方針**

- `AdditionalLayoutSections`、`LayoutLink`、`LayoutSectionFields` は追加節の値と位置を保持する。

#### 新規型 `AdditionalLayoutSections`

**属性・型**

```text
AdditionalLayoutSections { customLinks?: readonly LayoutLink[]; miniLayout?: LayoutSectionFields; summaryLayout?: LayoutSectionFields; feedLayout?: { items: readonly string[]; sourceKeys: ConvertKeys } }
```

**方針**

- `AdditionalLayoutSections`、`LayoutLink`、`LayoutSectionFields` は追加節の値と位置を保持する。

**処理・互換性の補足** 4つのレイアウト節を既存のXML変換から繰り返し可能な構造として保持し、pageAnalysis.ts でリンク・項目の利用へ変換する。存在する節だけを getLayoutDetails に載せる。

**変更コード案**

```ts
// types/metadata/layout.ts + processor/Metadata/pageAnalysis.ts
type LayoutLink = { name: string; sourceKeys: ConvertKeys };
type LayoutSectionFields = { fields: readonly string[]; sourceKeys: ConvertKeys };
type AdditionalLayoutSections = {
    customLinks?: readonly LayoutLink[];
    miniLayout?: LayoutSectionFields;
    summaryLayout?: LayoutSectionFields;
    feedLayout?: { items: readonly string[]; sourceKeys: ConvertKeys };
};
// XML要素名 customLink はリストへ変換し、詳細スキーマは追加節を任意にする。
```

**確認ケース** 4節あり、節なし、節内の項目だけ変更された入力で詳細と差分が整合することを確認する。

<a id="implementation-detail-36"></a>

## 36. Flow などの参照の残り

**解決したい問題** Flow の承認申請や通知、レポートの関係先列、重複ルールの条件を変更影響の探索に含めたい。

**現行コード** analyzeFlowRefs は refsOfNode で種類別抽出を行い、その他のXML参照は refs.ts の EXTRACTORS によって処理される。未解決IDや複数段の関係パスには追加の文脈が要る。

**主な修正先** [`src/analyzer/processor/Metadata/flowRefs.ts`](../../src/analyzer/processor/Metadata/flowRefs.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)、[`src/analyzer/processor/Metadata/automation.ts`](../../src/analyzer/processor/Metadata/automation.ts)、[`src/analyzer/types/metadata/flow.ts`](../../src/analyzer/types/metadata/flow.ts)、[`src/analyzer/types/metadata/recordTypes.ts`](../../src/analyzer/types/metadata/recordTypes.ts)

**コード修正案** Flow の submit と通知を候補として抽出し、通知ID→メタデータ名の対応を提供できる場合に解決する。レポートタイプは関係を順にたどり、重複条件はオブジェクトを確定してから項目へ写す。

### 関数・型の変更一覧

#### 既存関数 `refsOfNode`

**引数・戻り値**

```text
refsOfNode(node: FlowElementJson | FlowResourceJson | FlowStartJson, startObject: string | undefined): { refType: FlowRefType; target: string }[]
```

**方針**

- `refsOfNode` と `analyzeFlowRefs` に submit／通知を追加する。

#### 既存関数 `analyzeFlowRefs`

**引数・戻り値**

```text
analyzeFlowRefs(flow: FlowJson): FlowRefInfo[]
```

**方針**

- `refsOfNode` と `analyzeFlowRefs` に submit／通知を追加する。

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- `analyzeMetadataRefs` ではレポートタイプおよび重複ルールの抽出器へ対象項目を足す。

#### 既存型 `FlowRefType`

**属性・型**

```text
FlowRefType に追加する値: 'approvalProcess'
通知に使う既存値: 'customNotificationType'
```

**方針**

- `FlowRefType` と `FlowRefInfo` は追加の参照経路を識別できるよう拡張する。
- 通知名が判明しない場合はIDを候補のまま保持する。

#### 既存型 `FlowRefInfo`

**属性・型**

```text
FlowRefInfo { refType: FlowRefType; target: string; element: string; elementKind: string; sourceKeys?: ConvertKeys }
```

**方針**

- `FlowRefType` と `FlowRefInfo` は追加の参照経路を識別できるよう拡張する。

#### 新規関数 `resolveAdditionalReference`

**引数・戻り値**

```text
resolveAdditionalReference(candidate: PendingReference, context: MetadataContext): MetadataRefInfo | undefined
```

**方針**

- `resolveAdditionalReference(candidate, context)` は承認名・通知ID表・関係パス・項目名を種別に応じて解決する。

#### 新規型 `AdditionalReference`

**属性・型**

```text
AdditionalReference = { kind: 'approvalSubmit'; object: string; processName?: string } | { kind: 'customNotification'; notificationId: string } | { kind: 'reportTypeField'; rootObject: string; relationshipPath: string[]; field: string } | { kind: 'duplicateRuleField'; object: string; field: string }
```

**方針**

- `AdditionalReference` は approvalSubmit／customNotification／reportTypeField／duplicateRuleField の判別共用体。

#### 新規型 `PendingReference`

**属性・型**

```text
PendingReference = AdditionalReference & { unitId: string; sourceKeys: ConvertKeys }
```

**方針**

- `PendingReference` は単位IDと sourceKeys を付けた候補。

**処理・互換性の補足** Flow submit の対象、通知ID、レポートタイプの関係パス、重複ルール条件に個別の解決規則を加える。通知IDは対応する名前が判明した場合に結び、判明しない理由を診断に使える形で扱う。

**変更コード案**

```ts
// processor/Metadata/flowRefs.ts + references.ts
type AdditionalReference =
    | { kind: 'approvalSubmit'; object: string; processName?: string }
    | { kind: 'customNotification'; notificationId: string }
    | { kind: 'reportTypeField'; rootObject: string; relationshipPath: string[]; field: string }
    | { kind: 'duplicateRuleField'; object: string; field: string };
type PendingReference = AdditionalReference & { unitId: string; sourceKeys: ConvertKeys };
// 抽出器は PendingReference を返し、解決器で通知ID表や関係パスを引く。
```

**確認ケース** 各種別で関係先まで解決できる例と、対応表・関係要素の欠落例を用意する。

<a id="implementation-detail-37"></a>

## 37. 項目の属性の残り

**解決したい問題** CustomField の securityClassification を変更したとき、項目一覧と前後差分に反映したい。

**現行コード** field.ts の FIELD_SCHEMA と既知要素が読取範囲を決める。項目がそこで消えると diff/field.ts や getObjectFields からは取り出せない。

**主な修正先** [`src/analyzer/types/metadata/field.ts`](../../src/analyzer/types/metadata/field.ts)、[`src/analyzer/processor/Metadata/diff/field.ts`](../../src/analyzer/processor/Metadata/diff/field.ts)、[`src/analyzer/report/object.ts`](../../src/analyzer/report/object.ts)

**コード修正案** 単一属性を FIELD_SCHEMA へ足し、summaryFilterItems は独立した行型で読む。差分ロジックに比較対象を加え、一覧の出力スキーマへ任意フィールドとして渡す。

### 関数・型の変更一覧

#### 既存関数 `makeCustomFieldJson`

**引数・戻り値**

```text
makeCustomFieldJson(element: XmlElement, apiName: string, file: XmlFile, registry: XmlSourceRegistry): CustomFieldJson
```

**方針**

- `makeCustomFieldJson` で分類属性と集計条件を読み、`makeCustomFieldDiff` と `getObjectFields` へ渡す。

#### 既存関数 `makeCustomFieldDiff`

**引数・戻り値**

```text
makeCustomFieldDiff(before: CustomFieldJson, after: CustomFieldJson, match?: Match, sources?: Sources): CustomFieldJsonDiff
```

**方針**

- `makeCustomFieldJson` で分類属性と集計条件を読み、`makeCustomFieldDiff` と `getObjectFields` へ渡す。

#### 既存関数 `getObjectFields`

**引数・戻り値**

```text
getObjectFields(input: SnapshotInput, filter?: ObjectFilter & { includeImplicit?: boolean }): ObjectFieldRow[]
```

**方針**

- `makeCustomFieldJson` で分類属性と集計条件を読み、`makeCustomFieldDiff` と `getObjectFields` へ渡す。

#### 既存型 `CustomFieldJson`

**属性・型**

```text
CustomFieldJson { encryptionScheme?: string; securityClassification?: string; complianceGroup?: string; summaryFilterItems?: readonly SummaryFilterItem[] }
```

**方針**

- `CustomFieldJson` と `ObjectFieldRowSchema` に任意の分類・暗号化属性を追加する。
- `CustomFieldJsonDiff` には該当属性と集計条件の比較結果を追加する。

#### 既存型 `CustomFieldJsonDiff`

**属性・型**

```text
CustomFieldJsonDiff { content?: FieldClassificationDiff }
```

**方針**

- `CustomFieldJsonDiff` には該当属性と集計条件の比較結果を追加する。

#### 既存型 `ObjectFieldRow`

**属性・型**

```text
ObjectFieldRow { encryptionScheme?: string; securityClassification?: string; complianceGroup?: string; summaryFilterItems?: readonly SummaryFilterItem[] }
```

**方針**

- `CustomFieldJson` と `ObjectFieldRowSchema` に任意の分類・暗号化属性を追加する。

#### 新規関数 `readSummaryFilterItems`

**引数・戻り値**

```text
readSummaryFilterItems(element: XmlElement, context: { file: XmlFile; registry: XmlSourceRegistry }): SummaryFilterItem[]
```

**方針**

- `readSummaryFilterItems(element, context)` は条件を元順序の配列へ変換し、各行の位置を保持する。
- 単一属性の取得は既存のスキーマ読取を使う。

#### 新規型 `SummaryFilterItem`

**属性・型**

```text
SummaryFilterItem { field: string; operation: string; value?: string; sourceKeys: ConvertKeys }
```

**方針**

- `SummaryFilterItem` は項目・演算・値・位置を持つ。

#### 新規型 `FieldClassification`

**属性・型**

```text
FieldClassification { encryptionScheme?: string; securityClassification?: string; complianceGroup?: string; summaryFilterItems?: readonly SummaryFilterItem[] }
```

**方針**

- 分類属性の束はコード例の `FieldClassification` を既存項目型に合成する。

#### 新規型 `FieldClassificationDiff`

**属性・型**

```text
FieldClassificationDiff {
    encryptionScheme?: ValueDiff<string>;
    securityClassification?: ValueDiff<string>;
    complianceGroup?: ValueDiff<string>;
    summaryFilterItems?: TypedListDiff<SummaryFilterItem, SummaryFilterItemDiff>;
}
```

**方針**

- `SummaryFilterItem` は項目・演算・値・位置を持つ。

**処理・互換性の補足** field.ts の読取と Diff の比較に個別の属性を登録する。summaryFilterItems は列名・演算子・値を持つ行として順序を保持し、getObjectFields から必要な列へ投影する。

**変更コード案**

```ts
// types/metadata/field.ts
type SummaryFilterItem = {
    field: string;
    operation: string;
    value?: string;
    sourceKeys: ConvertKeys;
};
type FieldClassification = {
    encryptionScheme?: string;
    securityClassification?: string;
    complianceGroup?: string;
    summaryFilterItems?: readonly SummaryFilterItem[];
};
// XML変換、field diff、ObjectFieldRowSchema の同じ属性に型を反映する。
```

**確認ケース** 属性が欠ける旧入力、分類だけの変更、集計条件が複数ある入力で結果を比較する。

<a id="implementation-detail-38"></a>

## 38. 暗黙の標準項目をオブジェクトごとに変える

**解決したい問題** OwnerId を持たないオブジェクトの項目一覧に OwnerId が現れると、参照チェックで正しい項目か判断できなくなる。

**現行コード** Metadata/analysis.ts の getImplicitFields は ObjectType を引数にする。report/object.ts でもこの呼出し形なので同種別の個別差を表せない。

**主な修正先** [`src/analyzer/report/object.ts`](../../src/analyzer/report/object.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)、[`src/analyzer/processor/Metadata/analysis.ts`](../../src/analyzer/processor/Metadata/analysis.ts)

**新規パス候補** `src/analyzer/types/metadata/standardFields.ts`

**コード修正案** apiName と ObjectType を渡し、共通セットにオブジェクト別の追加・除外を適用する。analyzeObject と provider の両方でこの結果を使用し、実際の明示項目を優先する。

### 関数・型の変更一覧

#### 既存関数 `getImplicitFields`

**引数・戻り値**

```text
getImplicitFields(objectType: ObjectType, apiName?: string): ObjectFieldInfo[]
```

**方針**

- `getImplicitFields` は objectType と apiName を受け、`analyzeObject` と `getObjectFields` の呼び出しをそろえる。

#### 既存関数 `analyzeObject`

**引数・戻り値**

```text
analyzeObject(object: CustomObjectJson): ObjectInfo
```

**方針**

- `getImplicitFields` は objectType と apiName を受け、`analyzeObject` と `getObjectFields` の呼び出しをそろえる。

#### 既存関数 `getObjectFields`

**引数・戻り値**

```text
getObjectFields(input: SnapshotInput, filter?: ObjectFilter & { includeImplicit?: boolean }): ObjectFieldRow[]
```

**方針**

- `getImplicitFields` は objectType と apiName を受け、`analyzeObject` と `getObjectFields` の呼び出しをそろえる。

#### 既存関数 `makeReferenceChecker`

**引数・戻り値**

```text
makeReferenceChecker(context: MetadataContext): ReferenceChecker
```

**方針**

- `makeReferenceChecker` は同じ合成済みの項目集合を参照する。

#### 既存型の直接変更なし

**方針**

- `ObjectFieldInfo` と `ObjectInfo` の公開構造は維持する。明示項目がある場合は apiName をキーに暗黙項目を除外する。

#### 新規関数 `standardFieldsFor`

**引数・戻り値**

```text
standardFieldsFor(objectName: string, common: readonly ObjectFieldInfo[]): readonly ObjectFieldInfo[]
```

**方針**

- `standardFieldsFor(objectName, common)` は共通項目へオブジェクト固有の追加・除外を適用して返す。

#### 新規型 `StandardFieldOverrides`

**属性・型**

```text
StandardFieldOverrides { add: readonly ObjectFieldInfo[]; omit: ReadonlySet<string> }
```

**方針**

- `StandardFieldOverrides` は追加する項目の配列と除外する項目名の集合を持つ内部型。

**処理・互換性の補足** 標準項目を共通・オブジェクト固有・除外の順で合成する。getObjectFields の暗黙項目生成と参照先チェックを同じ関数へ接続し、明示定義がある項目を優先する。

**変更コード案**

```ts
// types/metadata/standardFields.ts + processor/Metadata/analysis.ts
type StandardFieldOverrides = {
    add: readonly ObjectFieldInfo[];
    omit: ReadonlySet<string>;
};
function standardFieldsFor(objectName: string, common: readonly ObjectFieldInfo[]) {
    const patch = standardOverrides.get(objectName);
    if (!patch) return common;
    return [...common.filter((field) => !patch.omit.has(field.apiName)), ...patch.add];
}
// getImplicitFields の呼出し元から objectName を渡し、明示定義を最後に適用する。
```

**適用箇所のコード案**

```ts
// processor/Metadata/analysis.ts の analyzeObject 側
const explicitNames = new Set(explicitFields.map(({ apiName }) => apiName.toLowerCase()));
const implicit = getImplicitFields(object.objectType, object.apiName).filter(
    ({ apiName }) => !explicitNames.has(apiName.toLowerCase()),
);
const analyzedFields = [...explicitFields, ...implicit];
// report/object.ts でも objectType と apiName を両方渡し、
// makeReferenceChecker には暗黙項目も含む ObjectInfo を渡す。
```

**確認ケース** OwnerId を持つオブジェクトと持たないオブジェクトで一覧と参照チェックの結果が一致することを確認する。

<a id="implementation-detail-39"></a>

## 39. パッケージディレクトリの重なりと翻訳の形式

**解決したい問題** 複数 packageDirectories に同名の翻訳やApexクラスがある場合に、採用元と衝突を確認したい。一体形式の翻訳も同じ行として比較したい。

**現行コード** ProjectTree は packageDirectories を絞り込みに使い、locateUnits は相対位置ごとに候補を集める。ObjectTranslationParser は対象ディレクトリの項目翻訳を読む構成。

**主な修正先** [`src/analyzer/unit/project.ts`](../../src/analyzer/unit/project.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/analyzer/unit/sourceTree.ts`](../../src/analyzer/unit/sourceTree.ts)、[`src/analyzer/parser/Metadata/folders.ts`](../../src/analyzer/parser/Metadata/folders.ts)、[`src/analyzer/parser/Metadata/objectTranslation.ts`](../../src/analyzer/parser/Metadata/objectTranslation.ts)、[`src/analyzer/types/metadata/objectTranslation.ts`](../../src/analyzer/types/metadata/objectTranslation.ts)

**コード修正案** 物理パスと論理単位IDを別に管理し、重複を検出したあと既定の採用規則を明文化する。一体XMLの親と項目も既存のメンバー構造へ変換し、ソース位置と採用元を両方保つ。

### 関数・型の変更一覧

#### 既存関数 `locateUnits`

**引数・戻り値**

```text
locateUnits(files: readonly string[], types?: readonly AnyUnitType[]): UnitLocations
```

**方針**

- `ProjectTree` で対象パッケージ順の情報を保持し、`locateUnits`／`Repository.load` で同じ論理IDの候補と採用元を管理する。
- `ObjectTranslationParser` に一体XMLの読取経路を追加する。

#### 既存関数 `Repository.load`

**引数・戻り値**

```text
Repository.load(tree: SourceTree, types?: readonly AnyUnitType[]): Promise<Repository>
```

**方針**

- `ProjectTree` で対象パッケージ順の情報を保持し、`locateUnits`／`Repository.load` で同じ論理IDの候補と採用元を管理する。

#### 既存型 `UnitLocations`

**属性・型**

```text
UnitLocations = Map<string, string[]>
```

**方針**

- 位置一覧は実パスを保つ。
- Repository の診断に論理ID、採用位置、非採用位置を含められるようにする。

#### 既存型 `ObjectTranslationParseResult`

**属性・型**

```text
ObjectTranslationParseResult =
    ObjectTranslationFileStructureType | ErrorObjectTranslationFileStructureType
```

**方針**

- `ObjectTranslationParseResult` の正常な出力は既存形式と共通にする。

#### 新規関数 `chooseUnit`

**引数・戻り値**

```text
chooseUnit(candidates: readonly UnitCandidate[]): { selected?: UnitCandidate; conflicts: UnitCandidate[] }
```

**方針**

- `chooseUnit(candidates)` は規則に従って採用候補と競合を返す。

#### 新規関数 `readCombinedObjectTranslation`

**引数・戻り値**

```text
readCombinedObjectTranslation(source: SourceText): ObjectTranslationParseResult
```

**方針**

- `readCombinedObjectTranslation(source)` は単一XMLを既存の翻訳メンバーへ変換する。

#### 新規型 `UnitCandidate`

**属性・型**

```text
UnitCandidate { unitId: string; packageIndex: number; relativePath: string }
```

**方針**

- `UnitCandidate` は論理ID、パッケージ順、実パスを持つ。

#### 新規型 `UnitLocationConflict`

**属性・型**

```text
UnitLocationConflict { unitId: string; selected: UnitCandidate; conflicts: readonly UnitCandidate[] }
```

**方針**

- `UnitLocationConflict` は決定した採用元と競合候補を保持する。

**処理・互換性の補足** 種別・論理名から衝突グループを作り、パッケージ順を候補選択規則として明記する。分割翻訳と一体の objectTranslation は同一の内部メンバー型へ正規化してから比較する。

**変更コード案**

```ts
// unit/project.ts + parser/Metadata/objectTranslation.ts
type UnitCandidate = { unitId: string; packageIndex: number; relativePath: string };
function chooseUnit(candidates: readonly UnitCandidate[]) {
    const ordered = [...candidates].sort((a, b) =>
        a.packageIndex - b.packageIndex || a.relativePath.localeCompare(b.relativePath)
    );
    return { selected: ordered[0], conflicts: ordered.slice(1) };
}
// 重複判定はレコードの単位境界で行い、分割翻訳の子ファイルを重複扱いしない。
```

**確認ケース** 順序が決まる衝突、同一パッケージ内の重複、一体／分割で同内容の翻訳を確認する。

<a id="implementation-detail-43"></a>

## 43. provider が `Repository` を直接読む

**解決したい問題** 例えば object.list だけの取得で、権限・Flow・LWC の集合も全て組み立てる構造を減らす。

**現行コード** snapshotOf は初回に Repository.get で各種類を取り、others も列挙する。registry.ts の対象providerは snapshotInputOf を毎回の入口としている。

**主な修正先** [`src/analyzer/report/snapshot.ts`](../../src/analyzer/report/snapshot.ts)、[`src/analyzer/report/types.ts`](../../src/analyzer/report/types.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/`](../../src/analyzer/report/)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/builder/inputs.ts`](../../src/builder/inputs.ts)

**コード修正案** 一つのproviderから ReportInput を直接渡し、必要な種類の before/after だけを取り出す。status を構造Diffの結果へ寄せ、行比較との違いを例で確認してから同じ方式を他に展開する。

### 関数・型の変更一覧

#### 既存関数 `getObjectList`

**引数・戻り値**

```text
getObjectList(input: ReportInput, filter?: ObjectFilter): ObjectListRow[]
```

**方針**

- `getObjectList` 等を必要な種類の Repository データと既存構造Diffを読む形へ変更する。

#### 既存関数 `snapshotInputOf`

**引数・戻り値**

```text
snapshotInputOf(input: ReportInput): SnapshotInput
```

**方針**

- `registry.ts` の provider の `run` から `snapshotInputOf` の呼出しを段階的に減らす。

#### 既存型 `ReportInput`

**属性・型**

```text
ReportInput { before?: Repository; after: Repository }
```

**方針**

- `ReportInput` は before/after Repository のまま使う。
- 移行した実装の入力を `SnapshotInput` から `ReportInput` へ変更し、行スキーマは維持する。

#### 既存型 `SnapshotInput`

**属性・型**

```text
SnapshotInput { before?: MetadataSnapshot; after: MetadataSnapshot }
```

**方針**

- 移行した実装の入力を `SnapshotInput` から `ReportInput` へ変更し、行スキーマは維持する。

#### 新規関数 `getObjectListFromRepositories`

**引数・戻り値**

```text
getObjectListFromRepositories(input: ReportInput, args: ObjectFilter): ObjectListRow[]
```

**方針**

- 移行中の `getObjectListFromRepositories(input, args)` は同じ行型を返す。
- 各providerの移行完了後は二重の実装を残さず既存名へ統合する。

#### 新規型なし

**方針**

- 公開型は追加しない。共通の型別単位取得と前後差分には Repository と UnitDiff の既存型を使う。

**処理・互換性の補足** まず小さな provider 群を ReportInput へ移し、必要な型だけを Repository から参照する。同じ before/after について既存 snapshot 経由の行・順序・変更状態と比較してから共通変換を削る。

**変更コード案**

```ts
// report/registry.ts の provider 移行例
const metadataObjectList = define({
    description: 'List objects.',
    category: 'object',
    shape: 'rows',
    args: objectArgs,
    output: z.array(ObjectListRowSchema),
    run: (input, args) => getObjectListFromRepositories(input, args),
});
// getObjectListFromRepositories は before/after の型別単位と構造Diffを読む。
```

**確認ケース** 1時点、追加・削除・変更を含む2時点、読み込み失敗した単位を含む入力で出力を比較する。

<a id="implementation-detail-44"></a>

## 44. オブジェクトの子を `RecordSpec` に移す

**解決したい問題** 同じ入力規則を object XML に含める場合と validationRules へ分割する場合で、別の比較結果になるのを避ける。

**現行コード** Object 子の一部は専用の変換・差分型を持つ一方、他のメタデータは RecordSpec から型と読取を導く。追加時に個別コードが増える。

**主な修正先** [`src/analyzer/types/metadata/record.ts`](../../src/analyzer/types/metadata/record.ts)、[`src/analyzer/types/metadata/object.ts`](../../src/analyzer/types/metadata/object.ts)、[`src/analyzer/types/metadata/recordTypes.ts`](../../src/analyzer/types/metadata/recordTypes.ts)、[`src/analyzer/types/metadata/validationRule.ts`](../../src/analyzer/types/metadata/validationRule.ts)、[`src/analyzer/types/metadata/webLink.ts`](../../src/analyzer/types/metadata/webLink.ts)、[`src/analyzer/parser/Metadata/record.ts`](../../src/analyzer/parser/Metadata/record.ts)、[`src/analyzer/parser/Metadata/decomposed.ts`](../../src/analyzer/parser/Metadata/decomposed.ts)、[`src/analyzer/processor/Metadata/diff/`](../../src/analyzer/processor/Metadata/diff/)

**コード修正案** RecordSpec に属性、子のキー、型を宣言し、decomposed.ts から同じ宣言へ入力を合流させる。専用 Diff と一覧の利用側はまず同一の公開型を保ち、結果を確認してから共通化する。

### 関数・型の変更一覧

#### 既存関数 `makeValidationRuleJson`

**引数・戻り値**

```text
makeValidationRuleJson(element: XmlElement, fullName: string, file: XmlFile, registry: XmlSourceRegistry): ValidationRuleJson
```

**方針**

- `decomposed.ts` と一体XML変換で同じ `RecordSpec` を使い、Metadata の子要素 Diff へ正規化済みレコードを渡す。

#### 既存型 `ValidationRuleJson`

**属性・型**

```text
ValidationRuleJson = RecordJson<typeof validationRuleSpec>
```

**方針**

- 入力規則・Webリンク・共有理由の既存JSON型を `RecordJson<typeof spec>` に寄せる。
- 旧出力の構造を保てる属性キーを選ぶ。

#### 新規関数 `readObjectChildRecord`

**引数・戻り値**

```text
readObjectChildRecord<S extends RecordSpec>(source: SourceText, spec: S): RecordJson<S>
```

**方針**

- `readObjectChildRecord(source, spec)` は分割と一体のXMLを同じレコード変換へつなぐ。
- 既存の汎用 RecordSpec 変換を優先し、重複する専用変換を整理する。

#### 新規型 `ValidationRuleRecord`

**属性・型**

```text
ValidationRuleRecord = RecordJson<typeof validationRuleSpec>
```

**方針**

- `ValidationRuleRecord` 等は spec から導出する型。
- 共通の `RecordSpec` 自体に子の固有フィールドを加えない。

**処理・互換性の補足** 子要素に論理キー、属性、繰り返し子行を RecordSpec で宣言する。分割ファイルと一体 XML の読取結果を同一型にし、型別 Diff と既存一覧へ順に渡す。

**変更コード案**

```ts
// types/metadata/recordTypes.ts + parser/Metadata/decomposed.ts
const validationRuleSpec = {
    kind: 'validationRule',
    schema: {
        fullName: 'string',
        active: 'boolean',
        errorConditionFormula: 'string',
        errorMessage: 'string',
        errorDisplayField: 'string',
    },
} as const satisfies RecordSpec;
type ValidationRuleRecord = RecordJson<typeof validationRuleSpec>;
// decomposed 側と一体XML側を同じ RecordSpec に通す。
```

**確認ケース** 同じ入力規則・Webリンク・共有理由を両形式で解析し、変更なしと単一属性の変更を確認する。

<a id="implementation-detail-45"></a>

## 45. 参照先の確かめを外す

**解決したい問題** 同じ不存在の項目を Flow と権限定義が参照したとき、同じ判定規則で両方のファイル位置に指摘を出す。

**現行コード** makeReferenceChecker はすでに共通だが、種類別解析が検証文脈を受け取って個別に突き合わせる箇所がある。

**主な修正先** [`src/analyzer/processor/Metadata/analysis.ts`](../../src/analyzer/processor/Metadata/analysis.ts)、[`src/analyzer/processor/Metadata/references.ts`](../../src/analyzer/processor/Metadata/references.ts)、[`src/analyzer/processor/Metadata/refs.ts`](../../src/analyzer/processor/Metadata/refs.ts)、[`src/analyzer/processor/Metadata/flowRefs.ts`](../../src/analyzer/processor/Metadata/flowRefs.ts)、[`src/analyzer/processor/dependency/units.ts`](../../src/analyzer/processor/dependency/units.ts)、[`src/analyzer/processor/dependency/graph.ts`](../../src/analyzer/processor/dependency/graph.ts)、[`src/analyzer/processor/dependency/types.ts`](../../src/analyzer/processor/dependency/types.ts)、[`src/analyzer/report/metadata.ts`](../../src/analyzer/report/metadata.ts)

**コード修正案** 種類別の解析は型付きの候補、unitId、sourceKeys を返す。集約段階で一度だけ MetadataContext を組み立て、候補種別から checker の関数を呼び分ける。

### 関数・型の変更一覧

#### 既存関数 `analyzeMetadataRefs`

**引数・戻り値**

```text
analyzeMetadataRefs(dataType: string, json: Record<string, unknown>, name: string): MetadataRefInfo[]
```

**方針**

- 各 Metadata 抽出器から `makeReferenceChecker` の呼出しを集約処理へ移し、`analyzeMetadataRefs` の候補を一括で検査する。

#### 既存関数 `makeReferenceChecker`

**引数・戻り値**

```text
makeReferenceChecker(context: MetadataContext): ReferenceChecker
```

**方針**

- 各 Metadata 抽出器から `makeReferenceChecker` の呼出しを集約処理へ移し、`analyzeMetadataRefs` の候補を一括で検査する。

#### 既存型 `MetadataFinding`

**属性・型**

```text
MetadataFinding { unitId?: string; sourceKeys?: ConvertKeys }
```

**方針**

- `MetadataFinding` に必要に応じて `unitId` を追加する。
- 既存 `MetadataContext` は検証段階でのみ使い、種類別の抽出結果から外す。

#### 新規関数 `validateReferences`

**引数・戻り値**

```text
validateReferences(candidates: readonly ReferenceCandidate[], context: MetadataContext): MetadataFinding[]
```

**方針**

- `validateReferences(candidates, context)` は共通 checker を一回生成して候補に適用する。

#### 新規関数 `checkCandidate`

**引数・戻り値**

```text
checkCandidate(checker: ReferenceChecker, reference: ReferenceCandidate): readonly ReferenceProblem[]
```

**方針**

- `checkCandidate(checker, reference)` は種別に対応する検査を呼ぶ。

#### 新規型 `ReferenceCandidate`

**属性・型**

```text
ReferenceCandidate { unitId: string; sourceKeys?: ConvertKeys; kind: 'field' | 'object' | 'flow' | 'lwc' | 'customLabel'; target: string }
```

**方針**

- `ReferenceCandidate` は unitId、sourceKeys、参照種別、参照先を保持する。
- 既存の `MetadataRefInfo` と重なる属性は実装時に共用する。

**処理・互換性の補足** 各抽出器は参照元ID、sourceKeys、参照先の候補を返す。集約後に一度だけ MetadataContext を組み立てて makeReferenceChecker に渡し、警告位置を各行のキーで復元する。

**変更コード案**

```ts
// processor/Metadata/references.ts
type ReferenceCandidate = {
    unitId: string;
    sourceKeys?: ConvertKeys;
    kind: 'field' | 'object' | 'flow' | 'lwc' | 'customLabel';
    target: string;
};
function validateReferences(candidates: readonly ReferenceCandidate[], context: MetadataContext) {
    const checker = makeReferenceChecker(context);
    return candidates.flatMap((reference) =>
        checkCandidate(checker, reference).map((problem) => ({ ...reference, ...problem }))
    );
}
```

**確認ケース** 異なる種別から同じ不足項目を参照する入力で、両方の参照元を追跡できることを確認する。

<a id="implementation-detail-46"></a>

## 46. 最初の provider の時間を短くする

**解決したい問題** 最初の crossRef.labels が遅く、2回目が速いとき、どの準備がボトルネックかを測って対応する。

**現行コード** getLabelUsages は dependencyGraphOf を呼び、labelsOf が辺を走査して snapshotOf から定義を取得する。複数のキャッシュ段階があるため、総時間だけでは改善先を特定できない。

**主な修正先** [`src/analyzer/report/snapshot.ts`](../../src/analyzer/report/snapshot.ts)、[`src/analyzer/report/crossRef.ts`](../../src/analyzer/report/crossRef.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/analyzer/processor/Metadata/labelAnalysis.ts`](../../src/analyzer/processor/Metadata/labelAnalysis.ts)

**コード修正案** 準備、グラフ構築、ラベル集計の区間を計る。支配的な処理だけを遅延化・共有し、maskRepository で入力インスタンスが変わる経路と比較時点をキャッシュ境界に含める。

### 関数・型の変更一覧

#### 既存関数 `getLabelUsages`

**引数・戻り値**

```text
getLabelUsages(input: ReportInput): LabelUsageRow[]
```

**方針**

- `getLabelUsages` と `labelsOf` は実測でボトルネックとなった定義・利用索引を再利用する。
- `snapshotOf` や `dependencyGraphOf` のキャッシュ寿命と整合させる。

#### 既存関数 `labelsOf`

**引数・戻り値**

```text
labelsOf(repository: Repository, graph: DependencyGraph): { name: string; value: string | undefined; sourceKeys: ConvertKeys; usages: { origin: string; unit: string }[] }[]
```

**方針**

- `getLabelUsages` と `labelsOf` は実測でボトルネックとなった定義・利用索引を再利用する。

#### 既存型の直接変更なし

**方針**

- `LabelUsageRow` の出力は維持する。タイミング計測は内部だけで扱い、レポートの行へ追加しない。

#### 新規関数 `labelIndexOf`

**引数・戻り値**

```text
labelIndexOf(repository: Repository): LabelUsageIndex
```

**方針**

- `labelIndexOf(repository)` は同じ入力の索引を再利用し、`buildLabelUsageIndex(repository)` は初回に必要な辺と定義をまとめる。

#### 新規関数 `buildLabelUsageIndex`

**引数・戻り値**

```text
buildLabelUsageIndex(repository: Repository): LabelUsageIndex
```

**方針**

- `labelIndexOf(repository)` は同じ入力の索引を再利用し、`buildLabelUsageIndex(repository)` は初回に必要な辺と定義をまとめる。

#### 新規型 `LabelUsageIndex`

**属性・型**

```text
LabelUsageIndex = ReadonlyMap<string, { definition?: CustomLabelJson; usages: readonly { origin: string; unit: string }[] }>
```

**方針**

- `LabelUsageIndex` はラベル名から定義と利用単位を引ける読み取り用マップ。
- マスク・比較時点の異なる入力同士では共有しない。

**処理・互換性の補足** cold／warm を分け、Repository 読取、snapshot 構築、ラベル索引、走査時間を計測する。支配的な索引を Repository の寿命に合わせて遅延生成し、入力更新時は別索引を使う。

**変更コード案**

```ts
// report/crossRef.ts
const labelIndexByRepository = new WeakMap<Repository, LabelUsageIndex>();
function labelIndexOf(repository: Repository): LabelUsageIndex {
    const existing = labelIndexByRepository.get(repository);
    if (existing) return existing;
    const startedAt = performance.now();
    const index = buildLabelUsageIndex(repository);
    labelIndexByRepository.set(repository, index);
    reportLabelIndexTiming(performance.now() - startedAt);
    return index;
}
// マスク済み Repository が都度生成される場合は、同じ安全な入力で再利用できる境界に置く。
```

**確認ケース** 同一入力の初回・再実行と、after が変わった場合の時間および出力を比較する。
