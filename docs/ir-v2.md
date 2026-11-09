# IR v2（apex_IR_v2・lwc_IR_v2）の作り方

Apex と LWC（JS / TS）の IR（構文木から作るノードのクラス）を、共通の基底クラス [types/commons/ir.ts](../src/analyzer/types/commons/ir.ts) に移したもの。v1（`apex_IR`・`lwc_IR`）と置き換える予定。

## 1. 基底クラス（`commons/ir.ts`）

- ノードは `CommonTypeClass<TName, TField>`。`TField` は `TypeField<TName> & { ...フィールド }`（`type` を持つ）。
- コンストラクタは `(type, フィールド, sourceSpan)`。objectKey（フィールドの中身の hash。キーを並べ替えてから）と sourceKey（位置の hash）、ソース位置の登録（`SourceObjectRegistory`）は基底クラスが行う。
- フィールドは `getFields()` で読む（`type` を含む）。子ノードは `getChildNodes()`（フィールドの中の `CommonTypeClass` を集める）。
- ノードの種類は `node.kind`（`type` と同じ）。ノードの和は `kind` で絞り込める。
- コンストラクタの引数は `FieldsOf<Fields>`（選択肢ごとに `type` を除いたもの）。フィールドを判別 union にしたとき、種類と中身の組み合わせを作るときにも確かめられる。
- 種類によって中身が違うノードは、判別 union にする（判別のフィールドは `kind`。[ir-v2-types.md](./ir-v2-types.md)）。
- Apex は `ApexCommonTypeClass`（[apex_IR_v2/commonVisitor.ts](../src/analyzer/types/apex_IR_v2/commonVisitor.ts)）、LWC は `LwcCommonTypeClass`（[lwc_IR_v2/commonVisitor.ts](../src/analyzer/types/lwc_IR_v2/commonVisitor.ts)）。エラーのノードはない（4 章）。
- キーは `getSourceKeys()`（`type_ハッシュ`。読まれたときに作る）、木のソース位置の一覧は `collectSourceObjects(root)`（[ir-v2-integration.md](./ir-v2-integration.md) 3.3）。

## 2. ノードのクラスの形

```ts
export type BreakStatementType = TypeField<'breakStatement'> & {
    label: IdTypeClass | null;
};

export class BreakStatementTypeClass extends ApexCommonTypeClass<
    'breakStatement',
    BreakStatementType
> {
    private constructor(fields: FieldsOf<BreakStatementType>, sourceSpan: SourceSpan) {
        super('breakStatement', fields, sourceSpan);
    }

    static create(ctx: BreakStatementContext): BreakStatementTypeClass {
        return new BreakStatementTypeClass(
            { label: createOptionalNode(ctx.id(), (c) => IdTypeClass.create(c), 'id') },
            getSourceSpan(ctx),
        );
    }

    getLabel(): BreakStatementType['label'] {
        return this.getFields().label;
    }
}

export const isBreakStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BreakStatementTypeClass => isSpicifyApexCommonTypeClass('breakStatement', target);
```

- 型の名前（`'breakStatement'`）は、クラス・`TypeField`・`super`・`isXxxType` で同じ文字列にする。
- 公開する名前（`XxxTypeClass`・`XxxType`・`isXxxType`・`XxxTypeClass.create`）は変えない。ほかのフォルダが使う。
- v1（`apex_IR`・`lwc_IR`）を import しない。

## 3. 子ノードの作り方

| 子                                                                                | 作り方                                                                                                                                              |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 型が 1 つに決まる子                                                               | その型の `create` を直接呼ぶ。Apex は `createNode`・`createOptionalNode`・`createNodeList`（下の 4 章）を通す                                       |
| 候補が複数あり、文脈のクラスで決まる子（Apex の Expression・Primary）             | Visitor（`ExpressionVisitor`・`PrimaryVisitor`）と `visitNode`・`visitOptionalNode`・`visitNodeList`                                                |
| 候補が複数あり、どの子があるかで決まる子（Apex の Statement・メンバーの宣言など） | `create` の中で `if (ctx.ifStatement()) … else if …` と振り分ける（[statement.ts](../src/analyzer/types/apex_IR_v2/statementVisitor/statement.ts)） |
| LWC の Babel の別名（Expression・Statement・LVal など）                           | Visitor（EvaluatePair）と `visitNode` など                                                                                                          |

Apex の文法（apex-parser）で、文脈のクラスで分かれる（ラベル付きの選択肢がある）のは Expression（24 種類）と Primary（8 種類）だけなので、Apex の Visitor はこの 2 つだけにする。

## 4. エラーの扱い

### 4.1 方針: 解析木にエラーのノードを残さない

コミット・プルリクエストに構文エラーを残す人は少ないので、エラーは解析木から切り出し、リスナーの resolvedError に出す。
解析木（IR）のノードはすべて `ApexCommonTypeClass` / `LwcCommonTypeClass` で、エラーのノード（v1 の `ApexErrorTypeClass`・`LwcErrorTypeClass`）はない。フィールドの型にもエラーのクラスは入らない。

| 部品（[commons/ir.ts](../src/analyzer/types/commons/ir.ts)） | 役割                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `IrError`                                                    | IR を作れなかったところ 1 つ（code・contextType・context・メッセージ・位置）。リスナーが受け取る形（`IrErrorLike`）を持つ |
| `IrBuildError`                                               | 子を作れなかったことを、区切りまで伝える例外                                                                              |
| `recoverIrBuild`                                             | 区切り。`IrBuildError` を捕まえて `IrError` を集め、代わりの値を返す                                                      |
| `collectIrErrors`                                            | 解析の単位（ファイル）の IR を作り、集めた `IrError` を返す。単位そのものを作れなければ result が null                    |

区切り（作れなかった子を木に入れない所）:

| 子                                                        | 作れなかったとき                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| 必須の子（`createNode`・`visitNode`）                     | `IrBuildError` を投げ、親を作るのをやめて、さらに上の区切りまで伝える |
| 省略できる子（`createOptionalNode`・`visitOptionalNode`） | null にする                                                           |
| 配列の要素（`createNodeList`・`visitNodeList`）           | その要素を除く（文・メンバーの 1 つが壊れても、ほかは残る）           |
| 穴を許す配列（LWC の `visitNullableNodeList`）            | 位置を変えないよう null にする                                        |
| 解析の単位（`buildApexIr`・`buildLwcIr`）                 | result が null                                                        |

- Apex: `create` の例外は、いちばん近い `createNode` の文脈の `EXCEPTION` にする。子がない `NULL_CHILD` は、位置の分かるいちばん近い親の位置にする（リスナーが構文エラーと重ねられるように）。Visitor が対応していない文脈は `UNSUPPORTED_CONTEXT`。
- LWC: ノード単位で例外は捕まえない（4.2）。Visitor の振り分けの `NULL_CHILD`・`UNSUPPORTED_CONTEXT` だけを `IrBuildError` にし、思わぬ例外は `buildLwcIr` が単位のエラーにする。
- リスナー（[parser/Apex/errorListener.ts](../src/analyzer/parser/Apex/errorListener.ts)・[parser/Lwc/errorListener.ts](../src/analyzer/parser/Lwc/errorListener.ts)）の `irErrors(errors)`: 構文エラーがあれば IR のエラーはその結果なので出さず、構文エラーだけを出す。構文エラーがなければ、IR の足りないところなので resolvedError に出す。

### 4.2 検証の結果

サンプルの Apex（14 ファイル）と LWC の JS / TS を、途中で切る・1 文字消す・トークンを 1 つ消すなどして壊し、解析した。

v1（エラーをノードとして木に残す）で出たエラーのノード:

|      | 入力     | 出たエラーのノード                                                                                                                                                       |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Apex | 1,154 件 | `EXCEPTION` 1,144（子がなく `create` が例外）、`UNSUPPORTED_CONTEXT` 155（ANTLR の回復で、種類の分からない ExpressionContext・PrimaryContext になった）、`NULL_CHILD` 14 |
| LWC  | 480 件   | Babel が回復できず IR を作らないもの 367 件。AST ができた 113 件では、エラーのノードは 0                                                                                 |

v2（エラーを木に残さず resolvedError に出す）:

|                      | 入力  | 外に出た例外 | 木の中のエラーのノード | IR のエラー                                                                                | 構文エラーなしで IR のエラーだけ出た入力 | resolvedError    |
| -------------------- | ----- | ------------ | ---------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------- |
| Apex（元のサンプル） | 28    | 0            | 0                      | 7（どれも構文エラーのあるサンプル Broken.cls・broken.apex）                                | 0                                        | 構文 18、IR 0    |
| Apex（壊したもの）   | 1,126 | 0            | 0                      | `NULL_CHILD` 952・`UNSUPPORTED_CONTEXT` 152・`EXCEPTION` 135（単位を作れなかったもの 116） | 0                                        | 構文 1,883、IR 0 |
| LWC（元のサンプル）  | 10    | 0            | 0                      | 0                                                                                          | 0                                        | 0                |
| LWC（壊したもの）    | 470   | 0            | 0                      | 0（Babel が回復できなかったもの 367）                                                      | 0                                        | 構文 382、IR 0   |

- 構文エラーのないファイルで IR のエラーが出たものはなかった。IR のエラーはどれも構文エラーの結果で、resolvedError には構文エラーだけが出る。
- LWC v2 は、同じソースで v1 と同じ木（ノードのクラス・フィールド・位置）になることも確かめた（サンプル 10 ファイル）。
