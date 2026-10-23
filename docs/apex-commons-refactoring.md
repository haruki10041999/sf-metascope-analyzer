# apex/commons.ts リファクタリング方針

対象: [src/analyzer/types/apex/commons.ts](../src/analyzer/types/apex/commons.ts)

## 1. commons.ts の役割

converter が出力した `CommonType` ツリーを JSON 生成層で使いやすい形に変換する。

- `sourceInfo` を外し、各ノードに `sourceKey`（出現位置の識別子）と `objectKey`（内容の識別子）を付ける
- 外した位置情報は `SourceJson[]` に `objectKey` 単位で集約する
- `convertExcludeError` で `ErrorInfo` を取り除き、エラーは `errorInfos` として別に返す
- 型側では、上記の変換結果を `Convert<T>` / `ConvertExcludeError<T>` で **深さに関係なく** 表現する

## 2. 現状の問題

### 2.1 型

| 問題                               | 内容                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TS2589                             | `isConvert<T>(value)` で union（例: `ValueType['value']`）を `Convert<T>` に絞り込む際、TS が深い再帰構造同士を構造比較する。`isConvert` の本体を `return false` にしても再現したため、原因は Typia ではなく **型の絞り込み（構造比較）** |
| 暫定対処の副作用                   | 現在の `Depth` 上限（6段）は、それより深い部分が `unknown` になり参照できない。最終形には不適                                                                                                                                             |
| 再帰型が4系統ある                  | `RewriteCommonTypeExtractContent` / `RewriteCommonTypeExtractSourceKey` / `RewriteConvert` / `RewriteConvertExcludeError`。前2つは中間表現の型で、外部からは使われない                                                                    |
| `ConvertExcludeError` のキー再写像 | `K in keyof T as Rewrite<T[K]> extends never ? never : K` は、キーごとに値型を2回展開するため最も重い                                                                                                                                     |
| `type` が `string`                 | `CommonType.type` がリテラル型でないため、判別共用体として絞り込めず、構造比較の型ガードに頼っている                                                                                                                                      |

### 2.2 実行時

| 問題                                  | 内容                                                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3回走査                               | `_extractSourceInfo` → `_splitSourceKey`（ノードごとに部分木を再走査）→ `_makeConvertType`。`_splitSourceKey` が各ノードで呼ばれるため、深さ方向に二乗的なコストになる |
| `sources.find` の線形探索             | `sourceKey` から `SourceInfo` を引くのに配列を毎回探索している                                                                                                         |
| 不要な async                          | ハッシュ計算のためだけに全体が `async` + `Promise.all` になっている                                                                                                    |
| Typia による構造判定                  | `isCommonTypeExtractContent` / `isErrorConvert` が再帰型全体の検証コードを生成する。実際に必要なのは「`type` と `sourceKey` を持つか」「`type === 'error'` か」だけ    |
| ジェネリックな `typia.is<Convert<T>>` | 関数内の `T` は未解決の型引数なので、Typia が呼び出し側ごとの `T` で検証することはできない。型ガードとして意図どおりに機能していない                                   |
| 未使用                                | `isCommonConvert`, `isCommonTypeExtractSourceKey`                                                                                                                      |

### 2.3 利用側（JSON 生成層）

- `castConvert` / `castExcludeErrorInfo` / `searchConvertAll` / `isError` / `writeSourceKeys` / `removeSourceInfo` などを import しているが、`commons.ts` には存在しない（旧 API の名残）
- `isConvert(entry, isFieldNameType)` の2引数呼び出しがあるが、`isConvert` は1引数
- `castConvert(castExcludeErrorInfo(...))` の入れ子が多く、エラー除外を値ごとに繰り返している

## 3. 方針

### 方針A: 判別は `type` リテラルで行う（TS2589 の根本対策）

構造比較の型ガードをやめ、`type` の値で絞り込む。

```ts
// converter 側
export type CommonType<TName extends string = string> = {
    type: TName;
    sourceInfo: SourceInfo;
};

export type SubQueryType = CommonType<'subQuery'> & { ... };
```

```ts
// 利用側
if (value.type === 'subQuery') {
    // value は Convert<SubQueryType> に絞り込まれる
}
```

- 判別共用体の絞り込みは `type` プロパティの比較だけで済み、深い構造比較が起きない
- `isConvert<T>` は不要になる。残す場合も `type` を見る実装にする

```ts
export const isConvertOf = <TName extends string>(
    target: { type: string },
    name: TName,
): target is Extract<typeof target, { type: TName }> => target.type === name;
```

前提作業: converter の `type: xxxTypeClass.getType()` が `string` を返すため、各ルールで型名のリテラルを返すようにする（IR 側の `getType()` をリテラル型にするか、converter で定数を渡す）。

### 方針B: 再帰型を1系統に絞る

- 中間表現の型（`CommonTypeExtractContent` / `CommonTypeExtractSourceKey` と各 `Rewrite*`）は削除する。実装内部は `unknown` で扱い、公開する戻り値だけを型付けする
- `Depth` を撤廃する
- `ConvertExcludeError` はキーの除外をやめ、値から `ErrorInfo` を `Exclude` する形にする

```ts
type ConvertNode<T> = T extends CommonType
    ? { objectKey: string; sourceKey: string } & {
          [K in Exclude<keyof T, 'sourceInfo'>]: ConvertNode<T[K]>;
      }
    : T extends readonly (infer U)[]
      ? ConvertNode<U>[]
      : T extends object
        ? { [K in keyof T]: ConvertNode<T[K]> }
        : T;

export type Convert<T extends CommonType> = ConvertNode<T>;

type ExcludeErrorNode<T> = T extends ErrorInfo
    ? never
    : T extends CommonType
      ? { objectKey: string; sourceKey: string } & {
            [K in Exclude<keyof T, 'sourceInfo'>]: ExcludeErrorNode<T[K]>;
        }
      : T extends readonly (infer U)[]
        ? ExcludeErrorNode<U>[]
        : T extends object
          ? { [K in keyof T]: ExcludeErrorNode<T[K]> }
          : T;

export type ConvertExcludeError<T extends CommonType> = ExcludeErrorNode<T>;
```

- `Omit<T, 'sourceInfo'>[K]` を `T[K]`（キーは `Exclude<keyof T, ...>`）にして中間型の生成を減らす
- 値が `ErrorInfo` のみのプロパティは `never` 型として残る。実行時は該当キーが消えるので、型側は「存在しない値＝参照されない」と割り切る（現状の利用箇所でエラーのみのプロパティを参照する箇所はない想定。移行時に確認する）

方針Aと組み合わせることで、mapped type は遅延評価のまま、絞り込みでの全展開が起きなくなる見込み。方針B単独では TS2589 が解消しない可能性があるため、**必ずAとセットで検証する**。

### 方針C: 実行時処理を1パス・同期処理にする

```ts
import { createHash } from 'node:crypto';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const isCommonNode = (v: unknown): v is CommonType =>
    typeof v === 'object' && v !== null && 'type' in v && 'sourceInfo' in v;

// 戻り値: [変換後ノード, objectKey 計算用の位置情報なし表現]
const convertNode = (
    target: unknown,
    sourceObjects: Map<string, SourceJson>,
): [unknown, unknown] => {
    if (Array.isArray(target)) {
        const pairs = target.map((item) => convertNode(item, sourceObjects));
        return [pairs.map(([c]) => c), pairs.map(([, k]) => k)];
    }
    if (target === null || typeof target !== 'object') {
        return [target, target];
    }

    const { sourceInfo, ...content } = target as Record<string, unknown>;
    const converted: Record<string, unknown> = {};
    const keyBody: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(content)) {
        [converted[key], keyBody[key]] = convertNode(child, sourceObjects);
    }

    if (!isCommonNode(target)) {
        return [converted, keyBody];
    }

    const sourceKey = `${target.type}_${hash(target.sourceInfo)}`;
    const objectKey = `${target.type}_${hash(keyBody)}`;
    registerSourceJson(sourceObjects, objectKey, sourceKey, target.sourceInfo);

    return [{ objectKey, sourceKey, ...converted }, keyBody];
};
```

- 子から `keyBody`（`sourceInfo` / `sourceKey` / `objectKey` を含まない内容）を返すため、部分木の再走査が不要になる
- 現行の `objectKey` は「`sourceKey` を除いた内容」のハッシュなので、`keyBody` と同じ値になる（移行時に出力差分で確認）
- `SourceJson` は `Map<objectKey, SourceJson>` で集約し、最後に配列化する
- `async` を外すと呼び出し側の `await` も不要になる。公開 API を急に変えたくない場合は、まず `makeConvertType` だけ `async` のまま残す
- 注意: 現行は親ノードを先に登録している（前順）。上記は子を先に登録する（後順）ため、`sourceObjects` の順序が変わる。順序を保つ必要がある場合は、親の登録位置を予約してから子を処理する

`convertExcludeError` も同様に、`isErrorConvert`（Typia）を `target.type === 'error'` の判定に置き換える。

### 方針D: 利用側のエラー除外を入口で1回にする

- 各 `makeXxxJson` の入口で `convertExcludeError` を1回呼び、以降は `ConvertExcludeError<T>` を直接参照する
- `castConvert(castExcludeErrorInfo(...))` の連鎖と、存在しない import を削除する
- エラー時の `ErrorJson` 生成は、入口の共通処理にまとめる

## 4. 移行手順

1. **準備**: 現行の出力を保存する（`docs/examples/apex-ir/generate-converter-output.ts`、`generate-json-output.ts`）。比較の基準にする
2. **方針C（実行時）**: `makeConvertType` / `convertExcludeError` の内部を置き換える。公開シグネチャは維持し、出力差分がないこと（または順序差分のみであること）を確認する
3. **方針A（型名リテラル化）**: converter の `CommonType` に型名パラメータを追加し、各型をリテラル化する。converter テストで検証する
4. **方針B（型の整理）**: `Depth` と中間型を削除し、`Convert` / `ConvertExcludeError` を差し替える
5. **利用側の置き換え**: `isConvert<T>(x)` を `x.type === '...'` に置き換える（現在 TS2589 が出ている `query/commons.ts`、`query/soqlFunction.ts` から着手）
6. **方針D**: JSON 生成層の cast 連鎖と古い import を整理する

## 5. 検証

- TS2589 が出ないこと: `npx ttsc --noEmit 2>&1 | Select-String TS2589`
- 型情報が深い階層まで残ること: 例として `ConvertExcludeError<ValueType>` から値リスト → 値 → サブクエリ → 条件と辿るテスト用の型アクセスを書き、`unknown` にならないことを確認する
- converter テスト: `npx --no-install ttsx --noCheck --project docs\examples\apex-ir\tsconfig.converter.json test/converter/<file>.test.ts`
- 出力比較: 手順1で保存した出力との差分を確認する（`objectKey` / `sourceKey` の値が変わらないこと）

## 6. リスク・未決事項

| 項目                          | 内容                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| 型名リテラル化の作業量        | converter の型数が多い。IR の `getType()` をリテラル型にできれば converter 側の変更は小さくなる    |
| `sourceObjects` の順序        | 利用側が順序に依存しているか確認が必要                                                             |
| エラーのみのプロパティ        | 方針Bでは型上 `never` として残る。キーを型から消す必要がある箇所があれば、その型だけ個別に定義する |
| 方針Bだけでは解消しない可能性 | TS2589 の主因は絞り込み時の構造比較のため、方針Aの完了が前提                                       |
