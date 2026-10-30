# StatementDiff 実装方針

`src/analyzer/processor/Apex/diff/statement.ts` の `makeStatementDiff` の実装方針。

## 1. 目的とスコープ

- method / constructor / property のアクセサ / 初期化ブロックなどが持つ文の並び `(StatementJson | ErrorJson)[]` について、変更前 (`before`) と変更後 (`after`) の差分を求める。
- 入力は `FileStructureType` の宣言 (`declaration[].result.data`) から取り出した文の配列。どの宣言同士を比べるかは `DeclarationDiff` 側で決まっている前提とする。
- 差分の判定には、各ノードが持つ `sourceKeys.objectKey` / `sourceKeys.sourceKey` を使う。

## 2. 前提: objectKey / sourceKey の性質

`src/analyzer/types/apex/commons/convert.ts` の `convertNode` で付与される。

| キー | 計算元 | 変わる条件 | 同じ内容の文が複数あるとき |
|---|---|---|---|
| `objectKey` | `${type}_${hash(内容)}`。内容は `sourceInfo` / `objectKey` / `sourceKey` を除いたもので、**子の内容も含む** | 文の中身 (子孫を含む) が変わったとき | **同じ値になる** |
| `sourceKey` | `${type}_${hash(sourceInfo)}`。`sourceInfo` は `ctx.getText()` と開始・終了位置 (offset / line / column) | 中身が変わったとき、**または位置がずれたとき** | 位置が違うので別の値になる |

ここから次のことが言える。

1. **`objectKey` が同じなら、その文は子孫まで含めて同じ内容。** 中身を見て比べる必要はない。
2. **`objectKey` は空白・改行・コメントの変更や位置の移動では変わらない。** 版をまたいで「同じ文」を見つけるのに使える。
3. **`sourceKey` は版をまたいだ比較には使えない。** ファイルの上のほうを 1 行変えるだけで、それより下の文の `sourceKey` はすべて変わる。
4. **`objectKey` は 1 つの配列の中で重複しうる** (例: `i++;` が 2 回出てくる)。そのため `objectKey` だけを Map のキーにした対応付けはできない。

## 3. 方針の要点

- **一致の判定は `objectKey` で行う。** 置き換え後の JSON を中身ごと比べること (deep equal) はしない。
  - `FileStructureType` の文は、semantic (type / soql / sosl / memberAccess) が `{ kind, index, sourceKey }` の参照に置き換わっている。`index` は宣言の中での通し番号なので、前の文に SOQL が 1 つ増えただけで、後ろの文の参照もすべてずれる。
  - 文自身の `objectKey` は参照に置き換える前 (変換時) に計算されているので、semantic の中身も含んだ値になっている。そのため、参照のずれの影響を受けない。
- **順序は LCS (最長共通部分列) で合わせる。** `objectKey` の並びの LCS を取り、LCS に入った要素を `unchanged` とする。重複する `objectKey` も、LCS なら出現順に正しく対応付けられる。
- **LCS に入らなかった要素は、隣り合う `unchanged` の間 (gap) ごとに対応付ける。** gap の中で `kind` が同じものを順番に組にして `changed` とし、残りは `removed` / `added` にする。
- **`sourceKey` は差分の判定に使わない。位置が変わっただけの文は `unchanged` とする。**
  - `sourceKey` を使うのは、`sourceObject` (`findSourceInfo`) から元のソースの位置や文字列を引いて表示するときだけ。
- **入れ子のブロックは、`changed` になった文だけを再帰的に比べる。** `unchanged` の文は子孫も同じなので、中に入る必要はない。

## 4. アルゴリズム

### 4.1 要素のキー (getKey)

`StatementJson` には、`sourceKeys` を持たない要素がある。

| 要素 | キー |
|---|---|
| 通常の文 (`JsonType` / `StructureJson`) | `sourceKeys.objectKey` (`StructureJson` は `sourceKeys.base.objectKey`) |
| `ErrorJson` | `sourceKeys.objectKey` (通常の文と同じ) |
| 入れ子の配列 (`{ ... }` のブロック。`StatementJson` 自体が `(StatementJson \| ErrorJson)[]` を含む) | 子のキーの並びから作る: `block_${hash(子のキーの配列)}` |

ブロックのキーも子の `objectKey` だけから作るので、「同じなら中身も同じ」という性質は保たれる。

### 4.2 手順

```text
makeStatementDiff(before, after):
  1. beforeKeys = before.map(getKey), afterKeys = after.map(getKey)
  2. pairs = LCS(beforeKeys, afterKeys)          // [beforeIndex, afterIndex] の組の列
  3. pairs の各組を unchanged として出力する (位置が変わっていても unchanged)
  4. 隣り合う組の間 (と先頭・末尾) の gap ごとに:
       gapBefore = その間の before の要素, gapAfter = その間の after の要素
       a. kind が同じものを、先頭から順に組にする → changed
          (入れ子のブロックを持つ文なら、ラベルが同じ子ブロック同士で makeStatementDiff を再帰し children に入れる)
       b. 組にならなかった gapBefore → removed, gapAfter → added
  5. gap の結果 → 次の unchanged → ... の順に並べて返す
       (gap の中は「before の順の changed / removed」→「added」の順になる)
```

### 4.3 入れ子のブロックを持つ文

`changed` の文のうち、次のものは子の文の並びを持つので再帰して `children` を作る。
子ブロックにはラベルを付け、before と after で**ラベルが同じブロック同士**を比べる。片方にしかないブロック (例: `else` の追加) は空配列と比べるので、中の文はすべて `added` / `removed` になる。

| kind | 子の文の並び | ラベル |
|---|---|---|
| `if` | `conditionBlock[].block` | `if[0]`, `if[1]`, ... (条件の並び順) |
| `for` | `block` | `block` |
| `while` / `doWhile` | `body` | `body` |
| `runAs` | `block` | `block` |
| `switch` | `block[].block` | `when[0]`, `when[1]`, ... |
| `try` | try / catch / finally の各ブロック | `try[0]`, `catch[1]`, `finally[2]` |
| 入れ子の配列 | 配列そのもの | `block` |

`for` / `while` / `if` のブロックは、`{ }` がない 1 文だけの場合もあるので、配列でなければ 1 要素の配列として扱う。

条件の式など、文以外の部分が変わったかどうかは、その文の `objectKey` が変わったことでわかる。そこまで細かく分けるかは、まずは対象外 (未決事項を参照)。

## 5. 型の案

```ts
type StatementNode = StatementJson | ErrorJson;

export type StatementDiff =
    | { status: 'added'; after: StatementNode; afterIndex: number }
    | { status: 'removed'; before: StatementNode; beforeIndex: number }
    | {
          status: 'unchanged';
          before: StatementNode;
          after: StatementNode;
          beforeIndex: number;
          afterIndex: number;
      }
    | {
          status: 'changed';
          before: StatementNode;
          after: StatementNode;
          beforeIndex: number;
          afterIndex: number;
          /** 入れ子のブロックを持つ文のとき、ブロックごとの子の文の差分 (持たない文は空配列) */
          children: StatementBlockDiff[];
      };

/** 入れ子のブロック 1 つ分の差分。label は 'if[0]' / 'catch[1]' / 'when[2]' / 'body' など */
export type StatementBlockDiff = { label: string; diffs: StatementDiff[] };
```

- `status` ごとに union のメンバーを分ける。`'changed' | 'unchanged'` を 1 つのメンバーにまとめると、`Extract<StatementDiff, { status: 'unchanged' }>` が `never` になる (`UnitDiff` で起きたのと同じ問題)。
- 今の雛形は削除を `'deleted'`、`UnitDiff` は `'removed'` と呼んでいる。**どちらかに揃える** (この文書では `'removed'` にしている)。
- 追加・削除は 1 つの `statement` プロパティにまとめず、`before` / `after` に分ける。どちらの版の要素かが型でわかり、表示側で扱いやすくなる。
- `beforeIndex` / `afterIndex` は、表示や元のソースへのジャンプに使う。
- `changed` の `children` は、入れ子のブロックごとにラベル付きでまとめる。`if` の条件や `try` の catch が複数あるときに、どのブロックの差分かがわかるようにするため。

## 6. 例

```text
before                     after
[0] a = 1;                 [0] a = 1;
[1] b = query(...);        [1] log('x');         ← 追加
[2] if (a > 0) { x(); }    [2] b = query(...);
[3] return b;              [3] if (a > 0) { y(); }
                           [4] return b;
```

| 結果 | 内容 |
|---|---|
| unchanged | before[0] ↔ after[0]、before[1] ↔ after[2] (位置は変わったが中身は同じ)、before[3] ↔ after[4] |
| added | after[1] `log('x');` |
| changed | before[2] ↔ after[3] (同じ gap の中の `if` 同士)。`children` の `if[0]` に `x();` → `y();` の差分が入る |

after[2] の `b = query(...)` は、前に文が 1 つ増えたことで semantic の参照の index がずれる可能性がある。それでも `objectKey` は同じなので `unchanged` になる。

### 実際の Apex で確認した結果

10 章のコード例で、次の 2 つの版のメソッドの文を比べた結果。after では、ファイルの先頭に空行を 2 行足して全体の位置をずらしている。

```apex
// before                                         // after
Integer x = 1;                                    Integer x = 1;
                                                  List<Contact> c = [SELECT Id FROM Contact];
List<Account> b = [SELECT Id FROM Account ...];   List<Account> b = [SELECT Id FROM Account ...];
x++;                                              x++;
x++;
if (a > 0) { System.debug('x'); }                 if (a > 0) { System.debug('y'); }
else { System.debug('neg'); }                     else { System.debug('neg'); }
return x;                                         return x;
```

```text
unchanged b[0]->a[0] localVariable  Integer x = 1;
added     a[1]       localVariable  List<Contact> c = [SELECT ...];
unchanged b[1]->a[2] localVariable  List<Account> b = [SELECT ...];   ← 参照が {soql,1} → {soql,2} にずれても unchanged
unchanged b[2]->a[3] expression     x++;
removed   b[3]       expression     x++;                              ← 重複のうち 1 つを削除
changed   b[4]->a[4] if
  [if[0]]  changed   System.debug('x') → System.debug('y')
  [if[1]]  unchanged System.debug('neg')
unchanged b[5]->a[5] return x;
```

## 7. エッジケース

| ケース | 扱い |
|---|---|
| 同じ内容の文が複数ある | LCS が出現順に対応付ける。Map での対応付けはしない |
| 文の順番の入れ替え (移動) | LCS に入らなかった側が `removed` + `added` になる。必要なら後処理で、同じ `objectKey` の `removed` と `added` の組を `moved` にまとめる (未決事項) |
| 空白・コメントだけの変更、位置の移動 | `objectKey` は変わらないので `unchanged` |
| `if` の条件の途中に `else if` を追加 | 条件ブロックを並び順 (`if[0]`, `if[1]`, ...) で対応付けるため、追加した位置より後ろのブロックがずれて `changed` / `added` になる |
| semantic の中身だけ変わった (例: SOQL の条件) | 文の `objectKey` が変わるので `changed`。どの semantic が変わったかは、参照 (`refPoint.sourceKey.objectKey`) 同士を比べればわかる |
| `ErrorJson` | 通常の文と同じく `objectKey` で比べる。構文エラーの直し途中は、`removed` (エラー) と `added` (正しい文) になりやすい |
| 片方が空配列 | すべて `added` または `removed` |
| 宣言そのものが `ErrorJson` (ブロックが取れない) | `makeStatementDiff` には渡さず、`DeclarationDiff` 側で扱う |

## 8. 計算量

- LCS は O(n × m) (n, m は文の数)。メソッドの文は多くても数百なので、単純な動的計画法 (DP) で十分。
- 再帰するのは `changed` の文だけなので、変更のない部分の深い入れ子には入らない。
- 1 つの配列の文が数千を超えるようなら、Myers の差分アルゴリズム (O((n + m) × D)、D は差分の数) に置き換える。

## 9. テストの観点

- 追加・削除・変更・変更なしが 1 つずつのケース (上の「例」)
- 同じ内容の文の重複 (`i++;` × 2 から 1 つ削除)
- 先頭への追加で位置がずれても、後ろの文がすべて `unchanged` のままであること
- 前の文に SOQL を追加しても、後ろの SOQL を含む文が `unchanged` のままであること (参照の index のずれに影響されない)
- 入れ子の `if` / `for` / `try` の中だけが変わったときに、`children` に差分が入ること
- 文の順番の入れ替え
- `ErrorJson` を含む配列
- 空配列同士・片方だけ空

## 10. コード例

上の方針をそのまま実装した例。型チェックを通し、「実際の Apex で確認した結果」の出力になることを確認済み。
`hash` は `types/apex/commons/index.ts` から公開されていないので、`commons/utils` から直接 import している。

```ts
import { ErrorJson, StatementJson, isErrorJson } from '../../../types';
import { hash } from '../../../types/apex/commons/utils';

type StatementNode = StatementJson | ErrorJson;

export type StatementDiff =
    | { status: 'added'; after: StatementNode; afterIndex: number }
    | { status: 'removed'; before: StatementNode; beforeIndex: number }
    | {
          status: 'unchanged';
          before: StatementNode;
          after: StatementNode;
          beforeIndex: number;
          afterIndex: number;
      }
    | {
          status: 'changed';
          before: StatementNode;
          after: StatementNode;
          beforeIndex: number;
          afterIndex: number;
          /** 入れ子のブロックを持つ文のとき、ブロックごとの子の文の差分 */
          children: StatementBlockDiff[];
      };

/** 入れ子のブロック 1 つ分の差分。label は 'if[0]' / 'catch[1]' / 'when[2]' / 'body' など */
export type StatementBlockDiff = { label: string; diffs: StatementDiff[] };

/**
 * 比較用のキー。objectKey は子孫の内容も含むハッシュなので、一致すれば子孫まで同じ。
 * sourceKeys を持たない入れ子の配列 ({ ... } のブロック) は、子のキーの並びから作る。
 */
const getKey = (node: StatementNode): string =>
    Array.isArray(node) ? `block_${hash(node.map(getKey))}` : node.sourceKeys.objectKey;

const getKind = (node: StatementNode): string => (Array.isArray(node) ? 'block' : node.kind);

const toList = (node: StatementNode): StatementNode[] => (Array.isArray(node) ? node : [node]);

/** 入れ子のブロックを持つ文から、ラベル付きで子の文の並びを取り出す */
const getChildBlocks = (node: StatementNode): [string, StatementNode[]][] => {
    if (Array.isArray(node)) {
        return [['block', node]];
    }
    switch (node.kind) {
        case 'if':
            return isErrorJson(node.conditionBlock)
                ? []
                : node.conditionBlock.map((c, i) => [`if[${i}]`, toList(c.block)]);
        case 'for':
            return [['block', toList(node.block)]];
        case 'while':
            return [['body', toList(node.body)]];
        case 'doWhile':
            return [['body', node.body]];
        case 'runAs':
            return [['block', node.block]];
        case 'switch':
            return node.block.flatMap((w, i): [string, StatementNode[]][] =>
                isErrorJson(w) ? [] : [[`when[${i}]`, w.block]],
            );
        case 'try':
            return node.block.flatMap((t, i): [string, StatementNode[]][] =>
                isErrorJson(t) ? [] : [[`${t.condition}[${i}]`, t.block]],
            );
        default:
            return [];
    }
};

/** キーの並びの LCS を取り、一致した [beforeIndex, afterIndex] の組を順に返す */
const lcs = (before: string[], after: string[]): [number, number][] => {
    const n = before.length;
    const m = after.length;
    // dp[i][j] = before[i..] と after[j..] の LCS の長さ
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i]![j] =
                before[i] === after[j]
                    ? dp[i + 1]![j + 1]! + 1
                    : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
        }
    }

    const pairs: [number, number][] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (before[i] === after[j]) {
            pairs.push([i, j]);
            i++;
            j++;
        } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
            i++;
        } else {
            j++;
        }
    }
    return pairs;
};

/** changed の文の子ブロックを、ラベルが同じもの同士で比べる (片方にしかないブロックは空配列と比べる) */
const diffChildBlocks = (before: StatementNode, after: StatementNode): StatementBlockDiff[] => {
    const beforeBlocks = new Map(getChildBlocks(before));
    const afterBlocks = new Map(getChildBlocks(after));
    const labels = [...new Set([...beforeBlocks.keys(), ...afterBlocks.keys()])];

    return labels.map((label) => ({
        label,
        diffs: makeStatementDiff(beforeBlocks.get(label) ?? [], afterBlocks.get(label) ?? []),
    }));
};

/**
 * LCS に入らなかった区間 (gap) の対応付け。kind が同じものを先頭から順に組にして changed、
 * 残りを removed / added にする。
 */
const diffGap = (
    before: StatementNode[],
    after: StatementNode[],
    [beforeStart, beforeEnd]: [number, number],
    [afterStart, afterEnd]: [number, number],
): StatementDiff[] => {
    const diffs: StatementDiff[] = [];
    const remainingAfter: number[] = [];
    for (let ai = afterStart; ai < afterEnd; ai++) {
        remainingAfter.push(ai);
    }

    for (let bi = beforeStart; bi < beforeEnd; bi++) {
        const beforeNode = before[bi]!;
        const matched = remainingAfter.findIndex(
            (ai) => getKind(after[ai]!) === getKind(beforeNode),
        );
        if (matched === -1) {
            diffs.push({ status: 'removed', before: beforeNode, beforeIndex: bi });
            continue;
        }

        const ai = remainingAfter.splice(matched, 1)[0]!;
        const afterNode = after[ai]!;
        diffs.push({
            status: 'changed',
            before: beforeNode,
            after: afterNode,
            beforeIndex: bi,
            afterIndex: ai,
            children: diffChildBlocks(beforeNode, afterNode),
        });
    }

    for (const ai of remainingAfter) {
        diffs.push({ status: 'added', after: after[ai]!, afterIndex: ai });
    }
    return diffs;
};

export const makeStatementDiff = (
    before: StatementNode[],
    after: StatementNode[],
): StatementDiff[] => {
    const anchors = lcs(before.map(getKey), after.map(getKey));

    const diffs: StatementDiff[] = [];
    let beforeStart = 0;
    let afterStart = 0;
    // 末尾の gap も処理するため、配列の長さを番兵として最後に足す
    for (const [bi, ai] of [...anchors, [before.length, after.length] as [number, number]]) {
        diffs.push(...diffGap(before, after, [beforeStart, bi], [afterStart, ai]));
        if (bi < before.length && ai < after.length) {
            diffs.push({
                status: 'unchanged',
                before: before[bi]!,
                after: after[ai]!,
                beforeIndex: bi,
                afterIndex: ai,
            });
        }
        beforeStart = bi + 1;
        afterStart = ai + 1;
    }
    return diffs;
};
```

### 関数の役割

| 関数 | 役割 |
|---|---|
| `getKey` | 比較用のキー。文は `objectKey`、入れ子の配列は子のキーの並びのハッシュ |
| `getKind` | gap の中で `changed` の組を作るときの判定に使う種類 (`if` / `localVariable` / 入れ子の配列は `block` など) |
| `getChildBlocks` | 入れ子のブロックを、ラベル付きで取り出す (4.3 の表) |
| `lcs` | キーの並びの LCS。単純な動的計画法 (O(n × m)) |
| `diffGap` | LCS に入らなかった区間の `changed` / `removed` / `added` の振り分け |
| `diffChildBlocks` | `changed` の文の子ブロックを、ラベルが同じもの同士で再帰的に比べる |
| `makeStatementDiff` | 公開する関数。LCS の結果と gap の処理をつないで、差分の配列を返す |

## 11. 未決事項

- 移動 (`moved`) を独立した status にするか、`removed` + `added` のままにするか。
- `changed` の文で、条件式など文以外のどこが変わったかまで出すか。出すなら、式のノードにも同じ「`objectKey` で比べて違えば中に入る」方法が使える。
- gap の中の対応付けを「`kind` が同じものを順番に」から、似ている度合い (子の `objectKey` がどれだけ共通しているか) で選ぶ方法に強化するか。
- `DeclarationDiff` で宣言同士を対応付ける方法 (名前・シグネチャ・`objectKey` のどれを使うか) との分担。
