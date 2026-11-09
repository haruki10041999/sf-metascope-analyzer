# IR v2 の型の見直し（ビジネスロジックの型になっていないところ）

`apex_IR_v2`・`lwc_IR_v2` のノードの型のうち、ありえない組み合わせを書けてしまうところの一覧。どれも修正の対象。IR の作り方は [ir-v2.md](./ir-v2.md)。

## 1. 何を「ビジネスロジックの型」とするか

- **なっている例**: [apex_IR_v2/valueVisitor/value.ts](../src/analyzer/types/apex_IR_v2/valueVisitor/value.ts)。種類（`valueType`）ごとに、`value` に入るものが 1 つに決まる（判別 union）。`{ valueType: 'list', value: SignedNumber }` のような組み合わせは書けない。
- **なっていない例**: [apex_IR_v2/queryVisitor/soqlFunction.ts](../src/analyzer/types/apex_IR_v2/queryVisitor/soqlFunction.ts)。関数の名前（`value`）と引数（`param`）が別々の和なので、関数ごとに引数が違うのに `{ value: 'DISTANCE', param: FieldName }` や `{ value: 'FIELDS', param: null }` を書ける。

| 分類 | 内容                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | 種類を表すフィールドと中身のフィールドが別々の和で、ありえない組み合わせを書ける                                                               |
| B    | 役割の違う要素が 1 つの配列に混ざっている（位置で意味が決まる、数が決まっているのに配列）                                                      |
| C    | 一部の種類でしか意味のないフィールドを、すべての種類が持っている                                                                               |
| D    | `A \| B \| C` の値に、どれなのかを示すフィールドがない（typeof・instanceof・Array.isArray で調べるしかない）。または、出てこないノードを含む和 |
| E    | 値が決まっているのに `string`・`boolean \| null` になっている（優先度は低い）                                                                  |

## 2. 件数

| 範囲                                            | A   | B   | C   | D   | E   |
| ----------------------------------------------- | --- | --- | --- | --- | --- |
| Apex（expression・statement・declaration など） | 5   | 2   | 3   | 1   | 2   |
| Apex（query・clause・list・literal など）       | 7   | 1   | 3   | 4   | 3   |
| LWC（commons/）                                 | 22  | 6   | 9   | 4   | 7   |
| LWC（commons/ 以外）                            | 4   | 0   | 1   | 9   | 4   |

1 つの項目が 2 つ以上の分類に当たるときは、主なほうで数えた。

## 3. 決めたこと（全体にかかるもの）

| 項目                                       | 決めたこと                                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 判別のフィールドの名前                     | `kind` にそろえる（value.ts の `valueType` も `kind` にした）。Babel がすでに持っている判別のフィールド（`computed`・`operator`・`kind`・`phase` など）は、その名前のまま使う |
| LWC の IR の Flow・JSX・提案の段階の構文   | 残す（和からも外さない）。型の問題（A など）は直す                                                                                                                            |
| Babel 8 の判別 union                       | IR でも同じように分ける                                                                                                                                                       |
| 判別のフィールドを外から読めるようにするか | 基底クラスに `readonly kind: TName`（ノードの種類）を出した。ノードの和を `node.kind === 'xxx'` で絞り込める                                                                  |
| `boolean                                   | null`                                                                                                                                                                         | `boolean` にそろえた（LWC の abstract・override・optional・readonly・declare・definite など 57 フィールド） |

あわせて、基底クラスのコンストラクタの引数を `FieldsOf<Fields>`（選択肢ごとに type を除く）にした。`Omit<Fields, 'type'>` はフィールドが判別 union のとき選択肢をまとめてしまい、作るときに種類と中身の組み合わせを確かめられなかったため。

## 4. 調べている間に見つかった不具合（型の問題とは別。先に直す）

- **[apex_IR_v2/listVisitor/fieldList.ts](../src/analyzer/types/apex_IR_v2/listVisitor/fieldList.ts)**: `soslId_list().length > 0 ? soslId(0) : soqlFunction()` で値を選んでいるので、`FORMAT(COUNT(Id)) cnt` では別名の `cnt` が値になり、関数が失われる。関数のあとの別名（`TOLABEL(x) alias`）も捨てている。
- **[apex_IR_v2/restVisitor/arrayCreatorRest.ts](../src/analyzer/types/apex_IR_v2/restVisitor/arrayCreatorRest.ts)**: 文法上は `new X[]`（初期化子なし）も書けるが、create() は例外を投げる。
- **[apex_IR_v2/expressionVisitor/bitNotExpression.ts](../src/analyzer/types/apex_IR_v2/expressionVisitor/bitNotExpression.ts)**: 名前は BitNot だが、中身は XOR（`^`）。名前と意味が合っていない。
- **[lwc_IR_v2/commons/tSModuleDeclaration.ts](../src/analyzer/types/lwc_IR_v2/commons/tSModuleDeclaration.ts)**: create() が body を必須にしていて、`declare module 'x';` を扱えない（確かめが要る）。

## 5. 一覧

各項目は「分類・今の型・問題・直し方の案」。パスは `src/analyzer/types/apex_IR_v2/`・`src/analyzer/types/lwc_IR_v2/` からの相対パス。

### 5.1 Apex（expression・primary・statement・block・control・declaration・member・modifier・parameter）

A: 5 件、B: 2 件、C: 3 件、D: 1 件、E: 2 件

前提: 各ノードのクラスは `type`（`getType()` と `isXxxType`）を持つので、「別々のノードのクラスの和」は見分けられるとして対象外にした（例: ForInit.value・DotExpression.right・ConditionalExpression.value・Statement.statement・*MemberDeclaration.declaration・Annotation.param）。`returnType: TypeRefTypeClass | 'void'` も typeof で区別でき、選択肢が 2 つだけなので対象外。文法は apex-parser の Context のメソッドと create() の分岐から判断した。

#### declarationVisitor/classBodyDeclaration.ts（ClassBodyDeclarationType）

- 分類: A・C
- 今の型: `{ declaration: MemberDeclarationTypeClass | BlockTypeClass | null; modifiers: ModifierTypeClass[]; isStatic: boolean }`
- 問題: 文法は `SEMI`・`STATIC? block`・`modifier* memberDeclaration` の 3 通り。`isStatic` は block のときだけ、`modifiers` は memberDeclaration のときだけ意味がある。それなのに `{ declaration: MemberDeclaration, isStatic: true }`・`{ declaration: Block, modifiers: [PUBLIC] }`・`{ declaration: null, isStatic: true }` を書ける。static の初期化ブロックかを調べるのに、`isStatic && isBlockType(declaration)` の 2 つの条件が要る。
- 直し方の案:

```ts
type ClassBodyDeclarationType = TypeField<'classBodyDeclaration'> &
    (
        | { kind: 'empty' }
        | { kind: 'initializer'; isStatic: boolean; block: BlockTypeClass }
        | {
              kind: 'member';
              modifiers: ModifierTypeClass[];
              declaration: MemberDeclarationTypeClass;
          }
    );
```

#### controlVisitor/forControl.ts（ForControlType）

- 分類: A・C
- 今の型: `{ value: EnhancedForControlTypeClass | BasedExpressionTypeClass | null; init: ForInitTypeClass | null; update: ForUpdateTypeClass | null }`
- 問題: 文法は `enhancedForControl`・`forInit? SEMI expression? SEMI forUpdate?` の 2 通り。拡張 for では init・update は必ず null なのに、`{ value: EnhancedForControl, init: ForInit, update: ForUpdate }` を書ける。`value` が「拡張 for の制御部」と「通常の for の条件式」という別の意味を兼ねていて、`value === null`（条件のない通常の for）の意味が型から読めない。
- 直し方の案:

```ts
type ForControlType = TypeField<'forControl'> &
    (
        | { kind: 'enhanced'; control: EnhancedForControlTypeClass }
        | {
              kind: 'classic';
              init: ForInitTypeClass | null;
              condition: BasedExpressionTypeClass | null;
              update: ForUpdateTypeClass | null;
          }
    );
```

#### expressionVisitor/logicalExpression.ts（LogicalExpressionType）

- 分類: A・B
- 今の型: `{ value: ConditionalExpressionTypeClass[]; operator: 'AND' | 'OR' | 'NOT' | null }`
- 問題: 文法は `cond (SOQLOR cond)+`・`cond (SOQLAND cond)+`・`NOT cond` で、演算子は必ずある（null はありえない）。NOT の被演算子は 1 つ、AND・OR は 2 つ以上。それなのに `{ operator: 'NOT', value: [a, b, c] }`・`{ operator: 'AND', value: [] }`・`{ operator: null }` を書ける。NOT の被演算子は `value[0]` で取り出すしかない。
- 直し方の案:

```ts
type LogicalExpressionType = TypeField<'logicalExpression'> &
    (
        | {
              operator: 'AND' | 'OR';
              operands: [
                  ConditionalExpressionTypeClass,
                  ConditionalExpressionTypeClass,
                  ...ConditionalExpressionTypeClass[],
              ];
          }
        | { operator: 'NOT'; operand: ConditionalExpressionTypeClass }
    );
```

#### expressionVisitor/whereLogicalExpression.ts（WhereLogicalExpressionType）

- 分類: A・B
- 今の型: `{ value: WhereConditionalExpressionTypeClass[]; operator: 'AND' | 'OR' | 'NOT' | null }`
- 問題: LogicalExpression と同じ（Context も SOQLAND_list・SOQLOR_list・NOT で同じ）。null・空の配列・NOT に複数の被演算子、のどれも書ける。
- 直し方の案: LogicalExpression と同じ形にする（要素の型だけ替える）。共通のジェネリックな型 `SoqlLogical<T>` にまとめてもよい。

#### expressionVisitor/whereFieldExpression.ts（WhereFieldExpressionType）

- 分類: A・C・D
- 今の型: `{ left: FieldExpressionTypeClass | string; operator: ComparisonOperatorTypeClass | null; right: ValueTypeClass | null }`
- 問題: create() の分岐は 2 つ。
    1. fieldExpression → left は FieldExpression、operator・right は必ず null。
    2. `FORMULA(StringLiteral) comparisonOperator value` → left は文字列、operator・right は必ずある。

    それなのに `{ left: FieldExpression, operator: X, right: Y }`・`{ left: 'FORMULA(..)', operator: null, right: null }` を書ける。2 の left は `'FORMULA' + '(' + リテラル + ')'` をつないだ文字列なので、数式の中身を取り出すには文字列を解析し直す必要がある。

- 直し方の案:

```ts
type WhereFieldExpressionType = TypeField<'whereFieldExpression'> &
    (
        | { kind: 'field'; value: FieldExpressionTypeClass }
        | {
              kind: 'formula';
              formula: string;
              operator: ComparisonOperatorTypeClass;
              right: ValueTypeClass;
          }
    );
```

#### statementVisitor/mergeStatement.ts（MergeStatementType）

- 分類: B
- 今の型: `{ value: BasedExpressionTypeClass[]; accessLevel: AccessLevelTypeClass | null }`（コメントは「統合先と統合元の 2 つの式」）
- 問題: 文法は `MERGE accessLevel? expression expression SEMI` で、式はちょうど 2 つ（1 つ目が統合先、2 つ目が統合元）。型は長さの決まらない配列で、役割は添え字でしか分からない。`[]` や要素 3 つも書ける。
- 直し方の案: `{ master: BasedExpressionTypeClass; merged: BasedExpressionTypeClass; accessLevel: AccessLevelTypeClass | null }`

#### statementVisitor/ifStatement.ts（IfStatementType・IfStatementBranchType）

- 分類: B・C
- 今の型: `{ value: { value: ParExpressionTypeClass | 'else'; block: StatementTypeClass }[] }`
- 問題: create() が作る並びは「先頭は必ず if、if の分岐が 1 つ以上と、最後に else が 0 か 1 つ」。でも型では、else が先頭や途中に来る並び、else が 2 回出る並び、空の配列のどれも書ける。使う側は毎回「最後の要素が else か」を調べる必要がある。
- 直し方の案:

```ts
type IfBranch = { condition: ParExpressionTypeClass; block: StatementTypeClass };
type IfStatementType = TypeField<'ifStatement'> & {
    branches: [IfBranch, ...IfBranch[]];
    elseBlock: StatementTypeClass | null;
};
```

#### statementVisitor/tryStatement.ts（TryStatementType）

- 分類: C（A に近い）
- 今の型: `{ value: BlockTypeClass; catchBlock: CatchClauseTypeClass[]; finallyBlock: FinallyBlockTypeClass | null }`
- 問題: 文法は `TRY block (catchClause+ finallyBlock? | finallyBlock)`。catch も finally もない形 `{ catchBlock: [], finallyBlock: null }` を書ける（影響は小さい）。
- 直し方の案:

```ts
type TryStatementType = TypeField<'tryStatement'> & { block: BlockTypeClass } & (
        | {
              catchClauses: [CatchClauseTypeClass, ...CatchClauseTypeClass[]];
              finallyBlock: FinallyBlockTypeClass | null;
          }
        | { catchClauses: []; finallyBlock: FinallyBlockTypeClass }
    );
```

#### memberVisitor/anonymousBlockMember.ts（AnonymousBlockMemberType）

- 分類: C
- 今の型: `{ member: AnonymousMemberDeclarationTypeClass | StatementTypeClass; modifiers: ModifierTypeClass[] }`
- 問題: 文法は `modifier* anonymousMemberDeclaration`・`statement` の 2 通り。修飾子は宣言の側にしか付かないのに、`{ member: Statement, modifiers: [STATIC] }` を書ける。
- 直し方の案:

```ts
type AnonymousBlockMemberType = TypeField<'anonymousBlockMember'> &
    (
        | {
              kind: 'declaration';
              modifiers: ModifierTypeClass[];
              declaration: AnonymousMemberDeclarationTypeClass;
          }
        | { kind: 'statement'; statement: StatementTypeClass }
    );
```

#### memberVisitor/triggerBlockMember.ts（TriggerBlockMemberType）

- 分類: C
- 今の型: `{ member: TriggerMemberDeclarationTypeClass | StatementTypeClass; modifiers: ModifierTypeClass[] }`
- 問題: anonymousBlockMember と同じ（`modifier* triggerMemberDeclaration`・`statement`）。文に修飾子が付いた形を書ける。
- 直し方の案: anonymousBlockMember と同じ形にする。

#### modifierVisitor/normal.ts（NormalModifierType）

- 分類: D（優先度は低め）
- 今の型: `{ value: NormalModifierKeyword | AnnotationTypeClass }`
- 問題: キーワードの修飾子とアノテーションという別の選択肢を、どれなのかを示すフィールドなしで value 1 つに入れている。使う側は `typeof value === 'string'` か `isAnnotationType` で分けるしかない。アクセス修飾子・共有の設定という意味のまとまりも、型に出ていない。
- 直し方の案: `{ kind: 'keyword'; keyword: NormalModifierKeyword } | { kind: 'annotation'; annotation: AnnotationTypeClass }`（要るなら、アクセス修飾子・共有の設定の部分の型も切り出す）

#### E（値が決まっているのに string）

- **expressionVisitor/bitExpression.ts**: `operator: string`（LT・GT のトークンをつないだもの）。値は `'<<' | '>>' | '>>>'` だけ。ほかの二項の演算子はどれもリテラルの和なのに、これだけ string。→ `operator: '<<' | '>>' | '>>>'`
- **primaryVisitor/thisPrimary.ts・superPrimary.ts・voidPrimary.ts**: `value: string`（getText() の結果。大文字・小文字はソースのまま）。値は事実上 this・super・void.class で、ノードの type だけで意味が分かる。value にどんな文字列が入っても型の誤りにならない。→ `'this'`・`'super'`・`'void.class'` にそろえたリテラルの型にするか、value をなくす（優先度は低い）。

#### 補足（分類の外）

- **expressionVisitor/bitNotExpression.ts**: 型の名前は BitNot だが、中身は XOR（`^`、二項の演算子）。型は正しいが、名前と意味が合っていない。
- **declarationVisitor/propertyDeclaration.ts**: `blocks: PropertyBlockTypeClass[]` は文法上 `propertyBlock*` なので、getter・setter の重複も文法の段階では通る。文法と合わなくなるので対象外にした。

### 5.2 Apex（query・clause・list・literal・name・rest・call・entry・value など）

A: 7 件、B: 1 件（soqlFunction の DISTANCE も B に当たる）、C: 3 件、D: 4 件、E: 3 件

文法は node_modules/@apexdevtools/apex-parser/dist/cjs/antlr/ApexParser.cjs の各ルールで確かめた。

#### queryVisitor/soqlFunction.ts（SoqlFunctionType）

- 分類: A（＋B）
- 今の型: `value: SoqlFunctionValueType` と `param: FieldName | DateFieldName | SoqlFieldsParameter | (LocationValue | string)[] | SoqlFunction | null` が別々の和になっている。
- 問題: create() では、関数のグループごとに param が決まっている。
    - 通常の関数 → fieldName
    - 日付の関数 → dateFieldName
    - COUNT → fieldName か null
    - FORMAT → fieldName か soqlFunction
    - FIELDS → soqlFieldsParameter
    - DISTANCE → locationValue 2 つと単位の文字列

    それなのに、`{ value: 'DISTANCE', param: FieldName }`・`{ value: 'FIELDS', param: null }`・`{ value: 'AVG', param: DateFieldName }` も書けてしまう。また、DISTANCE の param は位置で意味が決まる配列（[0] 起点、[1] 終点、[2] 単位）で、その意味が型に出ていない。

- 直し方の案:

```ts
type SoqlFunctionType = TypeField<'soqlFunction'> &
    (
        | { value: NormalSoqlFunctionType; param: FieldNameTypeClass }
        | { value: DateFunctionType; param: DateFieldNameTypeClass }
        | { value: 'COUNT'; param: FieldNameTypeClass | null }
        | { value: 'FORMAT'; param: FieldNameTypeClass | SoqlFunctionTypeClass }
        | { value: 'FIELDS'; param: SoqlFieldsParameterTypeClass }
        | {
              value: 'DISTANCE';
              param: { from: LocationValueTypeClass; to: LocationValueTypeClass; unit: string };
          }
    );
```

#### queryVisitor/dateFormula.ts（DateFormulaType）

- 分類: A
- 今の型: `value: DateFormulaFunctionType | DateFormulaWithFunctionType; param: SignedIntegerTypeClass | null`
- 問題: param（signedInteger）があるのは `LAST_N_DAYS_N` など N の付く関数のときだけで、`TODAY` などでは必ず null。それなのに `{ value: 'TODAY', param: SignedInteger }`・`{ value: 'LAST_N_DAYS_N', param: null }` を書ける。
- 直し方の案: `{ value: DateFormulaFunctionType } | { value: DateFormulaWithFunctionType; param: SignedIntegerTypeClass }`

#### clauseVisitor/soslWithClause.ts（SoslWithClauseType）

- 分類: A（＋D）
- 今の型: `value: SoslWithClauseValueType; content: string | BoundExpression | FilteringExpression | NetworkList | null`
- 問題: content の中身は、キーワードごとに決まっている。
    - DIVISION・PRICEBOOKID → 文字列リテラルかバインド式
    - DATA_CATEGORY → filteringExpression
    - SNIPPET → 整数の文字列か null
    - SPELL_CORRECTION → 真偽値リテラルの文字列
    - NETWORK → networkList か文字列
    - METADATA → 文字列か null
    - HIGHLIGHT・SYSTEM_MODE・USER_MODE → 常に null

    それなのに、`{ value: 'HIGHLIGHT', content: FilteringExpression }` を書ける。また、content の string が「文字列リテラル」「整数」「真偽値」のどれなのかは、value を見ないと分からない。

- 直し方の案:

```ts
| { value: 'DIVISION' | 'PRICEBOOKID'; content: { kind: 'literal'; text: string } | { kind: 'bind'; expr: BoundExpressionTypeClass } }
| { value: 'DATA_CATEGORY'; content: FilteringExpressionTypeClass }
| { value: 'SNIPPET'; targetLength: string | null }
| { value: 'SPELL_CORRECTION'; enabled: string }
| { value: 'NETWORK'; content: { kind: 'in'; list: NetworkListTypeClass } | { kind: 'eq'; text: string } }
| { value: 'METADATA'; content: string | null }
| { value: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE' }
```

#### clauseVisitor/withClause.ts（WithClauseType）

- 分類: A（＋C・D）
- 今の型: `value: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED' | 'DATA_CATEGORY' | LogicalExpressionTypeClass; field: FilteringExpressionTypeClass | null`
- 問題: field に値があるのは DATA_CATEGORY のときだけなのに、どの value とも組み合わせられる（C）。value にキーワードの文字列と式のノードが混ざっていて、typeof でしか見分けられない（D）。
- 直し方の案: `{ kind: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED' } | { kind: 'DATA_CATEGORY'; filter: FilteringExpressionTypeClass } | { kind: 'EXPRESSION'; expression: LogicalExpressionTypeClass }`

#### callVisitor/methodCall.ts（MethodCallType）

- 分類: A
- 今の型: `value: IdTypeClass | null; param: ExpressionListTypeClass | null; reference: 'this' | 'super' | null`
- 問題: 文法は `id(...)`・`THIS(...)`・`SUPER(...)` の 3 通り。それなのに、value と reference が両方 null（何の呼び出しか分からない）の形や、両方に値がある形を書ける。
- 直し方の案: `{ param } & ({ kind: 'method'; value: IdTypeClass } | { kind: 'this' | 'super' })`

#### literalVisitor/whenLiteral.ts（WhenLiteralType）

- 分類: A（＋C・E）
- 今の型: `value: string | QualifiedNameTypeClass; valueType: 'integer' | 'long' | 'string' | 'longText' | 'id' | 'null'; operator: string | null`
- 問題: value が QualifiedName になるのは valueType が 'id' のときだけで、operator に値があるのは integer・long のときだけ。それなのに `{ valueType: 'id', value: '123' }`・`{ valueType: 'string', operator: '-' }` を書ける。また、operator は ADD・SUB をつないだだけの文字列（"-+-" など）で、符号の意味が型に出ていない。
- 直し方の案: `{ valueType: 'integer' | 'long'; value: string; signs: ('+' | '-')[] } | { valueType: 'string' | 'longText'; value: string } | { valueType: 'null' } | { valueType: 'id'; value: QualifiedNameTypeClass }`

#### listVisitor/fieldList.ts（SoslFieldType・FieldListTypeClass.create）

- 分類: A（＋情報の欠け・不具合）
- 今の型: `value: SoslIdTypeClass | SoqlFunctionTypeClass; func: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' | null`
- 問題: 文法は `soslId`・`TOLABEL(soslId) soslId?`・`CONVERT_CURRENCY(soslId) soslId?`・`FORMAT(soslId | soqlFunction) soslId?` の 4 通り。
    1. SoqlFunction が入るのは FORMAT のときだけなのに、`{ func: 'TOLABEL', value: SoqlFunction }`・`{ func: null, value: SoqlFunction }` を書ける。
    2. 関数の後ろの別名を入れるフィールドがなく、別名が捨てられている。
    3. **不具合**: create() は `soslId_list().length > 0 ? soslId(0) : soqlFunction()` で値を選んでいる。そのため `FORMAT(COUNT(Id)) cnt` では、別名の cnt が値になり、関数のほうが失われる。
- 直し方の案: `{ func: null; value: SoslIdTypeClass } | { func: 'TOLABEL' | 'CONVERT_CURRENCY'; value: SoslIdTypeClass; alias: SoslIdTypeClass | null } | { func: 'FORMAT'; value: SoslIdTypeClass | SoqlFunctionTypeClass; alias: SoslIdTypeClass | null }`

#### valueVisitor/locationValue.ts（LocationValueType）

- 分類: B（＋D）
- 今の型: `value: FieldNameTypeClass | BoundExpressionTypeClass | CoordinateValueTypeClass[]`
- 問題: 文法は `GEOLOCATION(coordinateValue, coordinateValue)` で、要素はちょうど 2 つ（[0] 緯度、[1] 経度）。それなのに型は長さの決まらない配列で、緯度と経度の区別も型に出ていない。どれなのかを示すフィールドもなく、配列かどうかは Array.isArray で見分けるしかない。
- 直し方の案: `{ kind: 'field'; value: FieldNameTypeClass } | { kind: 'bind'; value: BoundExpressionTypeClass } | { kind: 'geolocation'; latitude: CoordinateValueTypeClass; longitude: CoordinateValueTypeClass }`

#### queryVisitor/fieldSpec.ts（FieldSpecType）

- 分類: C
- 今の型: fieldList・where・listView・orderBy・limitClause・offsetClause の 6 つが、それぞれ null になりうる。
- 問題: 文法は `soslId ( '(' fieldList (WHERE ...)? (USING LISTVIEW = ...)? (ORDER BY ...)? limit? offset? ')' )?` で、where 以降は fieldList（括弧の部分）があるときだけ書ける。それなのに `{ fieldList: null, where: LogicalExpression }` を書ける。
- 直し方の案: `{ value: SoslIdTypeClass; spec: null | { fieldList: FieldListTypeClass; where: ... | null; listView: ... | null; orderBy: ... | null; limitClause: ... | null; offsetClause: ... | null } }`

#### restVisitor/arrayCreatorRest.ts（ArrayCreatorRestType）

- 分類: C（＋create() の食い違い）
- 今の型: `value: ArrayInitializerTypeClass | null; size: BasedExpressionTypeClass | null`
- 問題: 文法は `'[' expression ']'`（要素の数を書く）と `'[' ']' arrayInitializer?`（初期化子）の 2 通りで、size と value が同時に値を持つことはない。それなのに、両方に値があるもの・両方 null のものを書ける。また、文法上は `new X[]`（初期化子なし）も書けるが、create() は expression も arrayInitializer もないと例外を投げる。
- 直し方の案: `{ kind: 'sized'; size: BasedExpressionTypeClass } | { kind: 'initialized'; initializer: ArrayInitializerTypeClass | null }`

#### entryVisitor/selectEntry.ts・entryVisitor/subFieldEntry.ts（SelectEntryType・SubFieldEntryType）

- 分類: C
- 今の型: `value: FieldName | SoqlFunction | SubQuery | TypeOf; alias: SoqlIdTypeClass | null`
- 問題: 文法では typeOf のときだけ別名（`soqlId?`）を取らないのに、`{ value: TypeOf, alias: SoqlId }` を書ける（value 自体は子のノードの type で見分けられる）。
- 直し方の案: `{ value: FieldName | SoqlFunction | SubQuery; alias: SoqlIdTypeClass | null } | { value: TypeOfTypeClass }`

#### clauseVisitor/limitClause.ts・clauseVisitor/offsetClause.ts（LimitClauseType・OffsetClauseType）

- 分類: D
- 今の型: `value: string | BoundExpressionTypeClass`
- 問題: string は整数リテラルの文字列で、もう一方はバインド式。typeof でしか見分けられず、string が整数を表すことも型に出ていない。
- 直し方の案: `value: { kind: 'literal'; value: string } | { kind: 'bind'; value: BoundExpressionTypeClass }`

#### literalVisitor/soslLiteral.ts（SoslLiteralType）

- 分類: D
- 今の型: `value: string | BoundExpressionTypeClass`
- 問題: `FIND 'xxx'` と `FIND :var` の区別が typeof でしか付かない。
- 直し方の案: `search: { kind: 'literal'; text: string } | { kind: 'bind'; expr: BoundExpressionTypeClass }`

#### nameVisitor/typeName.ts（TypeNameType）

- 分類: D
- 今の型: `value: IdTypeClass | 'list' | 'set' | 'map'; generic: TypeArgumentsTypeClass | null`
- 問題: 組み込みのコレクションの型（文字列）と、ユーザーの型の名前（ノード）が 1 つのフィールドに混ざり、typeof で見分けるしかない。
- 直し方の案: `{ generic } & ({ kind: 'collection'; collection: 'list' | 'set' | 'map' } | { kind: 'named'; name: IdTypeClass })`

#### valueVisitor/whenValue.ts（WhenValueType）

- 分類: D
- 今の型: `{ variant: WhenLiteralTypeClass[] | 'else' } | { variantType: TypeRefTypeClass; variant: IdTypeClass }`
- 問題: 3 通り（`when else`・`when 値, 値`・`when 型 変数`）を表すのに、どれなのかを示すフィールドがない。見分けるには `'variantType' in`・`=== 'else'`・Array.isArray を組み合わせる必要がある。また、同じ variant という名前に、意味の違う 3 種類の値が入っている。
- 直し方の案: `{ kind: 'else' } | { kind: 'literals'; values: WhenLiteralTypeClass[] } | { kind: 'type'; typeRef: TypeRefTypeClass; variable: IdTypeClass }`

#### E（値が決まっているのに string）

- **clauseVisitor/allRowsClause.ts**: `value: string`（ALL と ROWS の文字をつないだもの）。中身は常に ALL ROWS で情報を持たず、ソースの大文字・小文字がそのまま入る（'all rows' など）。→ `'ALL ROWS'` にそろえるか、フィールドをなくす。
- **restVisitor/noRest.ts**: `value: string`（ctx.getText()）。文法上は常に `{}` で、情報を持たない。→ `'{}'` にするか、フィールドをなくす。
- **clauseVisitor/usingScope.ts**: `value: SoqlIdTypeClass`。USING SCOPE で使える値は決まっている（delegated・everything・mine・mine_and_my_groups・my_territory・my_team_territory・team）。→ これらのリテラルの和にし、知らない値は `{ unknown: SoqlIdTypeClass }` として残す（優先度は低い）。
- ほかの項目で触れたもの: WhenLiteral の operator、SoslWithClause の SNIPPET・SPELL_CORRECTION の content（整数・真偽値を文字列で持っている）。

#### 問題なしと判断したもの（参考）

- 子のノードだけの和（FieldGroupBy.value・FieldOrder.value・CoordinateValue.value・Creator.content・SelectEntry.value）: 子のノードの type で見分けられる。
- ComparisonOperator・SearchGroup・FilteringSelector・UpdateType・ForClauses・TriggerCase・FieldOrder の direction と nulls・GroupByClause.mode: すでにリテラルの型になっている。
- GroupByClause・SoslClauses・NormalQuery・SubQuery の各句: 文法上どれも省略できるので、null になりうるのは正しい。
- 細かい点: SoslClauses.withList は「なし」を空の配列でなく null で表し、ArraySubscripts.dimention は「配列でない」を 0 でなく null で表している。型の誤りではなく、表し方のそろえ方の問題。

### 5.3 LWC（commons/）

A: 22 件、B: 6 件、C: 9 件、D: 4 件、E: 7 件（全体にかかる指摘は 1 件として数える）

前提: Babel 8 は次のノードを判別 union に分けている。

- `computed: true / false` で key・property の型が分かれる: MemberExpression・OptionalMemberExpression・ClassMethod・ClassProperty・ClassAccessorProperty・ObjectProperty・ObjectMethod
- `operator: 'in'` のときだけ `left: PrivateName` を許す: BinaryExpression

IR はこれを平たい型（`computed: boolean`・`key: Expression | PrivateName`）にまとめて、Babel が保証していた組み合わせを失っている。下の A のうち、これに当たるものに【Babel 8 からの後退】と付けた。各 TypeClass は `type` を持つので、union 自体は見分けられる。D は「type では分かるが、文脈・役割の意味が失われる」ものに絞った。

#### LWC に関係するもの（A・B・C・D）

##### commons/classMethod.ts（ClassMethodTypeClass）

- 分類: A【Babel 8 からの後退】
- 今の型: `kind: 'constructor' | 'method' | 'get' | 'set'`・`computed: boolean`・`key: ExpressionTypeClass | PrivateNameTypeClass`・`params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass)[]`・static・generator・async・returnType・decorators がすべて別々。
- 問題:
    - `computed: false` で key がどんな式でも書ける。`key: PrivateName` は Babel 8 の型でもありえない（private のメソッドは ClassPrivateMethod に分かれる）。
    - `kind: 'constructor'` に static・generator・async・returnType・decorators を付けられる。
    - TSParameterProperty は constructor だけのものだが、`kind: 'get'` の params にも入れられる。
    - get は params 0 個、set はちょうど 1 個（rest は不可）だが、配列の型で表せていない。
    - LWC の `@api get / set` の判定で、ありえない状態を型が防がない。
- 直し方の案:

```ts
type MethodKey =
    | {
          computed: false;
          key:
              | IdentifierTypeClass
              | StringLiteralTypeClass
              | NumericLiteralTypeClass
              | BigIntLiteralTypeClass;
      }
    | { computed: true; key: ExpressionTypeClass };
type ClassMethodFields = TypeField<'classMethod'> &
    MethodKey & { body: BlockStatementTypeClass } & (
        | {
              kind: 'constructor';
              params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass)[];
          }
        | {
              kind: 'method';
              static: boolean;
              generator: boolean;
              async: boolean;
              params: FunctionParameterTypeClass[];
              decorators: DecoratorTypeClass[];
              returnType: ReturnType | null;
          }
        | {
              kind: 'get';
              static: boolean;
              params: [];
              decorators: DecoratorTypeClass[];
              returnType: ReturnType | null;
          }
        | {
              kind: 'set';
              static: boolean;
              params: [FunctionParameterTypeClass];
              decorators: DecoratorTypeClass[];
          }
    );
```

##### commons/classPrivateMethod.ts（ClassPrivateMethodTypeClass）

- 分類: A・C
- 問題: classMethod.ts のフィールドをそのまま写している。`#x` は常に computed でないので computed は要らない。kind に constructor はないのに、constructor だけの TSParameterProperty を params に入れられる。`#x` には TS のアクセス修飾子を付けられないのに、`abstract: true`・`accessibility: 'public'`・`optional: true` を書ける。
- 直し方の案: computed を消し、`params: FunctionParameterTypeClass[]` に狭める。TS の修飾子は消す（`override` だけ残す）。get・set の params の決まりは classMethod と共通の型にする。

##### commons/classProperty.ts（ClassPropertyTypeClass）

- 分類: A【Babel 8 からの後退】・C
- 問題:
    - `computed: false` で key がどんな式でも書け、key に PrivateName も入る（Babel 8 の型ではどちらも不可）。LWC の `@api foo`・`@wire foo` の名前を取るとき、key が Identifier だと保証されない。
    - TS で文法エラーになる組み合わせを書ける: declare・abstract・definite に value、definite と optional の両方、declare にデコレータ。
    - TS の修飾子と Flow の `variance` を同時に入れられる。
- 直し方の案: key は MethodKey で見分ける。初期化で分ける（`init: 'value' | 'none'（definite） | 'declare'`）。型注釈は `annotation: { lang: 'ts'; modifiers } | { lang: 'flow'; variance } | null` にまとめる。

##### commons/classAccessorProperty.ts

- 分類: A【Babel 8 からの後退】・C
- 問題: Babel 8 では PrivateName は computed でない側だけだが、IR では `computed: true` で key が PrivateName のものを書ける。classProperty と同じありえない組み合わせも書ける。
- 直し方の案: classProperty と同じ形にする（computed でない側の key に PrivateName を足す）。

##### commons/classPrivateProperty.ts

- 分類: C
- 問題: definite と value、optional と definite を同時に付けられる。Flow の variance と TS の readonly が同居できる。
- 直し方の案: `{ value: Expression; definite: false } | { value: null; definite: boolean }`。型注釈は annotation のまとまりにする。

##### commons/memberExpression.ts

- 分類: A【Babel 8 からの後退】
- 今の型: `object: Expression | Super; property: Expression | PrivateName; computed: boolean`
- 問題: `computed: false` で property が CallExpression、`computed: true` で property が PrivateName（`a[#x]`）、object が Super で property が PrivateName（`super.#x`）を書ける。
- 直し方の案: `{ computed: false; object: Expression; property: Identifier | PrivateName } | { computed: false; object: Super; property: Identifier } | { computed: true; object: Expression | Super; property: Expression }`

##### commons/optionalMemberExpression.ts

- 分類: A【Babel 8 からの後退】
- 問題・直し方: memberExpression と同じ（object は Expression だけ）。

##### commons/objectProperty.ts

- 分類: A【Babel 8 からの後退】・D
- 問題:
    - computed と key が連動していない。
    - `shorthand: true` なのに、`computed: true`・key が StringLiteral・value が key と別の名前の Identifier を書ける。
    - ObjectExpression と ObjectPattern の両方で同じ型を使うので、value が `Expression | PatternLike` で、どちらの文脈か分からない（D）。`@wire` の設定のオブジェクトを読むときに困る。
    - オブジェクトリテラルでは書けない decorators を持てる。
- 直し方の案: ObjectExpressionProperty と ObjectPatternProperty に分け、それぞれ `{ shorthand: false; value } | { shorthand: true; computed: false; key: Identifier; value: Identifier（| AssignmentPattern） }` にする。decorators は消す。

##### commons/objectMethod.ts

- 分類: A【Babel 8 からの後退】・C
- 問題: `computed: false` で key がどんな式でも書ける。get に async・generator・params、set に params 0 個、オブジェクトのメソッドに decorators を書ける。
- 直し方の案: key は MethodKey で見分け、kind ごとに params の型を分ける。decorators は消す。

##### commons/binaryExpression.ts

- 分類: A【Babel 8 からの後退】
- 問題: `operator: '+'` で left が PrivateName（`#x + 1`）を書ける。
- 直し方の案: `{ operator: 'in'; left: Expression | PrivateName } | { operator: Exclude<..., 'in'>; left: Expression }`

##### commons/exportNamedDeclaration.ts

- 分類: A
- 問題: declaration と specifiers・source はどちらか一方なのに、両方を書ける。ExportDefaultSpecifier・ExportNamespaceSpecifier・attributes を `source: null` で書ける。
- 直し方の案: `form` で見分ける: `'declaration' | 'local'（ExportSpecifier[]） | 'reexport'（source・attributes・3 種類の specifier）`

##### commons/exportSpecifier.ts

- 分類: A
- 問題: local が StringLiteral になれるのは再エクスポートのときだけなのに、ローカルの export でも書ける。親と子の両方に `exportKind: 'type'` を付けられる（二重の指定）。
- 直し方の案: ローカルの export 用に `LocalExportSpecifier { local: Identifier }` を分ける。

##### commons/importDeclaration.ts

- 分類: A・B
- 問題:
    - specifiers の役割が位置で決まる。Default は先頭に 1 個まで、Namespace は 1 個までで Named と一緒に使えない。それでも `[Named, Default, Default]` などを書ける（B）。
    - `phase: 'source'` は Default 1 個だけ、`phase: 'defer'` は Namespace 1 個だけだが、型で決まっていない（A）。
    - Flow だけの `importKind: 'typeof'` を書ける。親と子の両方に importKind を付けられる。
    - `module` は旧い仕様のフィールドで、phase と重なる。
- 直し方の案: `default: ImportDefaultSpecifier | null` と `bindings: { kind: 'named'; specifiers } | { kind: 'namespace'; specifier } | null` に分け、phase で見分ける union にする。

##### commons/variableDeclaration.ts

- 分類: A
- 問題: `const`・`using` で init のない declarator を書ける（for-in・for-of の左辺のほかでは init が要る）。declare と init を同時に付けられる。`using` の id はパターンにできないのに、決まっていない。`declarations: []` を書ける。
- 直し方の案: kind ごとに分ける。var・let は `NonEmpty<Declarator>`、const は `NonEmpty<InitializedDeclarator>`、using は `NonEmpty<InitializedIdentifierDeclarator>`、declare 付きは `NonEmpty<UninitializedDeclarator>`。

##### commons/forOfStatement.ts・forInStatement.ts

- 分類: A
- 問題: left が VariableDeclaration のとき、declarator は 1 個で init なしでなければならないが、普通の型を使っているので、複数・init 付きを書ける。for-in では `using` を書けないのに、決まっていない。
- 直し方の案: 専用の型 `ForHeadDeclaration { kind; declarator: { id } }` を使い、`left: ForHeadDeclaration | AssignmentTarget` にする。

##### commons/assignmentExpression.ts

- 分類: A
- 問題: 左辺がパターン（`[a, b] += x`）なのに `=` 以外の演算子を付けられる。OptionalMemberExpression は代入先にできないのに、許されている。
- 直し方の案: `{ operator: '='; left: Simple | ArrayPattern | ObjectPattern } | { operator: 複合の演算子; left: Simple }`。Optional は除く。

##### commons/arrowFunctionExpression.ts

- 分類: A・C
- 問題: `expression: true` で body が BlockStatement のものを書ける（expression は body から分かる）。アロー関数は generator になれないのに `generator: true` を書ける。
- 直し方の案: expression・generator を消し、`body: { kind: 'expression' } | { kind: 'block' }` にする。

##### commons/yieldExpression.ts

- 分類: A
- 問題: `yield*` は引数が要るのに、`delegate: true` で argument が null のものを書ける。
- 直し方の案: `{ delegate: true; argument: Expression } | { delegate: false; argument: Expression | null }`

##### commons/tryStatement.ts

- 分類: A
- 問題: handler と finalizer が両方 null（catch も finally もない try）を書ける。
- 直し方の案: `{ handler; finalizer | null } | { handler: null; finalizer }`

##### commons/classDeclaration.ts・classExpression.ts

- 分類: A・C
- 問題:
    - superClass が null なのに superTypeArguments を付けられる（`extends LightningElement` の判定で、両者が連動しない）。
    - ClassDeclaration の `id: null` が許されるのは `export default` のときだけ（親の文脈による）。
    - implements に TS と Flow の要素を混ぜられ、mixins（Flow）と abstract（TS）も同時に書ける。declare のクラスにデコレータを付けられる。
- 直し方の案: `heritage: { superClass; superTypeArguments } | null` にまとめる。id は null にしない（名前のないクラスは export default の側で表す）。TS・Flow のフィールドはまとまりに分ける。

##### commons/functionDeclaration.ts・functionExpression.ts・tSDeclareFunction.ts

- 分類: A・C
- 問題: FunctionDeclaration の `id: null` は export default のときだけ許される。declare 付きの関数は本体を持てない（TS では TSDeclareFunction になる）のに、body が要るまま declare を付けられる。TS と Flow の型注釈（returnType・typeParameters・predicate）を混ぜられる。
- 直し方の案: declare を消し、id を null にしない。型注釈は annotation のまとまりにする。

##### commons/callExpression.ts・newExpression.ts・optionalCallExpression.ts（A・優先度は低い）

- 問題: callee が Import（旧い `import()`）のとき、引数は 1〜2 個で Spread は不可だが、どんな配列でも書ける。ArgumentPlaceholder（提案の段階の構文）が普通の呼び出しにも入る。typeArguments に TS と Flow を混ぜられる。
- 直し方の案: callee で `{ kind: 'super' | 'import' | 'normal' }` に分ける。

##### commons/metaProperty.ts（A・E）

- 問題: 書けるのは `new.target` と `import.meta` だけなのに、`foo.bar` を書ける。
- 直し方の案: `{ kind: 'new.target' } | { kind: 'import.meta' }`

##### commons/tSMethodSignature.ts・tSPropertySignature.ts（A）

- 問題: `computed: false` で key がどんな式でも書ける。get・set の params の数が決まっていない。PropertySignature の kind は Babel で非推奨で、readonly・optional との意味のない組み合わせを書ける。
- 直し方の案: key は MethodKey で見分け、kind ごとに params を分ける。PropertySignature の kind は消す。

##### commons/tSTypePredicate.ts（A）

- 問題: asserts でない形（`x is T`）なのに型がないものを書ける。
- 直し方の案: `{ form: 'is'; typeAnnotation } | { form: 'asserts'; typeAnnotation | null }`

##### commons/tSModuleDeclaration.ts（A）

- 問題: `kind: 'namespace'` で id が StringLiteral、`kind: 'global'` で id が global でないものを書ける。本体のない `declare module 'x';` を扱えない（create() が body を必須にしている）。
- 直し方の案: kind ごとに id・body の型を分け、module のときだけ `body | null` を許す。

##### commons/tSLiteralType.ts（A）

- 問題: literal の UnaryExpression で許されるのは `-1`・`-1n` だけなのに、`typeof x` なども入る。
- 直し方の案: `{ kind: 'negative'; argument: Numeric | BigInt }`

##### commons/exportDefaultDeclaration.ts（D・C）

- 問題: 宣言の export か式の export かは、type からしか読めない。名前のないクラス・関数が許されるのはここだけなのに、その許可が ClassDeclaration の `id: null` に漏れている。exportKind は `'value'` だけで情報がない。LWC のコンポーネントのクラスはここから取るので重要。
- 直し方の案: `{ kind: 'class' | 'function' | 'expression' | 'ts' }` で分け、exportKind は消す。

##### 全体: 関数の params（関数のノードと TS のシグネチャすべて）（B）

- 問題: RestElement は最後に 1 個までだが、その位置の役割が型に出ていない。TS の this パラメータ（先頭だけ）も同じ。
- 直し方の案: `{ params: Param[]; rest: RestElement | null; thisParam? }`

##### commons/templateLiteral.ts・tSTemplateLiteralType.ts（B・D）

- 問題: quasis と expressions は交互に並ぶ 2 つの配列で、quasis は expressions より 1 個多くなければならないのに、長さの合わない状態を書ける。TemplateLiteral の expressions に TSType が入る（値の文脈に型のノードが混ざる、D）。
- 直し方の案: `{ head; spans: { expression; tail }[] }` にし、TemplateLiteral の expressions は Expression だけにする。

##### commons/tSIndexSignature.ts（B）

- 問題: parameters は「ちょうど 1 個で型注釈が要る」が、配列なので 0 個・複数を書ける。
- 直し方の案: `parameter: Identifier & { typeAnnotation }`

##### commons/tSTupleType.ts（B）

- 問題: 名前付きの要素と名前のない要素を混ぜられる。省略できる要素のあとに必須の要素を置ける。rest を複数置ける。
- 直し方の案: `{ named: false; elements: TSType[] } | { named: true; elements: TSNamedTupleMember[] }`

##### commons/objectPattern.ts（B・C）

- 問題: RestElement を最後でない位置に置ける。decorators・optional は関数の引数だけのものなのに、どの位置でも付けられる。
- 直し方の案: `{ properties; rest: RestElement | null }`

##### 全体: identifier・arrayPattern・objectPattern・assignmentPattern・restElement・restProperty（C）

- 問題: 参照の式の Identifier にも optional・decorators・typeAnnotation を付けられる。RestElement・AssignmentPattern に `optional: true` を付けられる。
- 直し方の案: 参照用の `Identifier { name }`、束縛用の `BindingIdentifier { name; annotation }`、引数用の `Param { pattern; optional; decorators }` に分ける。

##### 全体: Flow と TS の型注釈が混ざる（C・D）

- 問題: returnType・typeParameters・predicate・variance・implements が、フィールドごとに Flow か TS かを選べる。1 つのファイルではどちらかしか使わないのに、混ざった状態を書ける。LWC は JS・TS だけなので、Flow の側は実際には要らない。
- 直し方の案: `annotations: { lang: 'ts'; ... } | { lang: 'flow'; ... } | null` にまとめるか、LWC の IR から Flow を外す。

##### commons/decorator.ts（D）

- 問題: `expression: Expression` なので、`@api`（Identifier）と `@wire(adapter, config)`（Call）の区別が instanceof 頼みになる。`@a + b` のような文法上ありえない形も書ける。
- 直し方の案: `{ kind: 'identifier' | 'member' | 'call' | 'parenthesized' }` で分ける。

##### commons/unaryExpression.ts（C・E）

- 問題: 常に前置なのに `prefix: false` を書ける。LWC はモジュール（strict）なので `delete` の対象に Identifier は書けないのに、書ける。
- 直し方の案: prefix を消し、delete のときは argument を Member だけにする。

##### commons/restProperty.ts・spreadProperty.ts・regexLiteral.ts・numberLiteral.ts（C・優先度は低い）

- 問題: Babel で非推奨の別名。同じものを 2 種類の IR の型で表せてしまう。
- 直し方の案: create のときに正規の型に寄せ、別名のクラスは消す。

#### Flow・JSX（優先度は低い）

- **jSXElement.ts（A）**: selfClosing と closingElement・children が連動していない。→ `{ selfClosing: true; closingElement: null; children: [] } | { selfClosing: false; closingElement; children }`
- **declareExportDeclaration.ts（A）**: declaration と specifiers・source はどちらか一方なのに別々。`default: true` と specifiers も同時に書ける。→ exportNamedDeclaration と同じく form で見分ける。
- **objectTypeAnnotation.ts（A）**: `exact: true` と `inexact: true` を同時に書ける。→ `exactness: 'exact' | 'inexact' | 'default'`
- **objectTypeProperty.ts（A）**: get に `method: true`・`optional: true` を付けられる。proto と static も同時に書ける。
- **declareOpaqueType.ts（A）**: Babel では impltype を持たないのに、IR では impltype に値を入れられる。
- **enumStringBody.ts（B）**: 初期化子のあるメンバーとないメンバーを混ぜられる。→ `{ initialized: true | false; members }`

#### E（値が決まっているのに string・boolean | null）

- **regExpLiteral・regexLiteral の `flags: string`**: フラグの集合（d・g・i・m・s・u・v・y。u と v はどちらか一方）にする。
- **各所の abstract・override・optional・readonly・declare・definite・asserts・const（`boolean | null`）**: null と false の区別に意味がないので、null にならない boolean にする。
- **classMethod・classPrivateMethod の `access`**: accessibility と重なるので 1 つにする。
- **importDeclaration の `module`**: phase と重なる旧いフィールドなので消す。
- **exportDefaultDeclaration の `exportKind: 'value' | null`**: 値が 1 種類しかないので消す。
- **importKind・exportKind**: null を `'value'` にそろえ、null にならないようにする。TS 用の IR では `'typeof'` を除く。
- **tSMappedType の readonly・optional（`true | '+' | '-' | null`）**: true は '+' と同じなので、`'+' | '-' | null` にそろえる。
- 参考: 演算子・kind・accessibility・Program.sourceType は、Babel 8 の型ですでにリテラルの和になっているので問題ない。

#### 補足（確かめが要るもの）

- **tSImportEqualsDeclaration.ts**: Babel の `isExport` を持っていない可能性がある。
- **tSModuleDeclaration.ts**: create() が body を必須にしている。`declare module 'x';` の扱いを確かめたほうがよい。
- **SwitchCase（別のフォルダ）**: default は 1 個まで、という同じ種類の B がある。

### 5.4 LWC（commons/ 以外）

A: 4 件、B: 0 件、C: 1 件、D: 9 件、E: 4 件

前提:

- LWC のパーサが有効にしているのは `typescript`（.ts のときだけ）と `decorators` だけ（[parser/Lwc/script.ts](../src/analyzer/parser/Lwc/script.ts)）。flow・jsx・functionBind・doExpressions・moduleBlocks・pipeline・placeholders・v8intrinsic・discardBinding のノードは出てこない。
- @babel/types は 8.0.6。Babel 8 自身は TSDeclareMethod などを `computed: true / false` の判別 union にしているが、IR ではそれが失われている。

#### typeScriptVisitor/tSDeclareMethod.ts（TSDeclareMethodTypeClass）— computed と key

- 分類: A
- 今の型: `computed: boolean; key: ExpressionTypeClass | PrivateNameTypeClass`
- 問題: Babel 8 では、`computed: true` なら key は `Expression`、`computed: false` なら `Identifier | StringLiteral | NumericLiteral | BigIntLiteral | PrivateName` と決まっている。IR では 1 つにまとめられているので、`computed: false` で key が CallExpression になるもの、`computed: true` で key が PrivateName になるものも書けてしまう。
- 直し方の案: `{ computed: true; key: ExpressionTypeClass } | { computed: false; key: IdentifierTypeClass | StringLiteralTypeClass | NumericLiteralTypeClass | BigIntLiteralTypeClass | PrivateNameTypeClass }`

#### typeScriptVisitor/tSDeclareMethod.ts（TSDeclareMethodTypeClass）— kind とシグネチャ

- 分類: A
- 今の型: `kind: 'get' | 'set' | 'method' | 'constructor'` とは別に、params・generator・async・static・returnType・typeParameters がそれぞれ独立している。
- 問題: kind によって取れる値は決まっている。
    - get: params は 0 個、generator と async は false、typeParameters はない。
    - set: params はちょうど 1 個、returnType と typeParameters はない。
    - constructor: static・generator・async は false、returnType と typeParameters はない。

    今の型では、`kind: 'get'` で params が 2 個のもの、`kind: 'constructor'` で `static: true` かつ returnType のあるものも書けてしまう。

- 直し方の案: kind で判別する union にする。`{ kind: 'get'; params: []; generator: false; async: false; typeParameters: null; ... } | { kind: 'set'; params: [FunctionParameterTypeClass]; returnType: null; ... } | { kind: 'constructor'; static: false; returnType: null; ... } | { kind: 'method'; ... }`

#### typeScriptVisitor/tSDeclareMethod.ts（TSDeclareMethodTypeClass）— params の TSParameterProperty

- 分類: C
- 今の型: `params: (FunctionParameterTypeClass | TSParameterPropertyTypeClass)[]`（kind に関係なく同じ）
- 問題: TSParameterProperty を書けるのは constructor だけだが、method・get・set の params にも入る型になっている。
- 直し方の案: TSParameterPropertyTypeClass は、constructor の variant の params だけに含める。

#### typeScriptVisitor/tSParameterProperty.ts（TSParameterPropertyTypeClass）

- 分類: A
- 今の型: `accessibility | null; readonly: boolean | null; override: boolean | null`
- 問題: TSParameterProperty は、修飾子が少なくとも 1 つ付いた引数だけを指すノード。今の型では、3 つとも null という「パラメータプロパティではない」状態も書けてしまう。
- 直し方の案: 「accessibility がある」「readonly が true」「override が true」の 3 通りの union にし、readonly と override は `boolean` にそろえる。

#### standardizedVisitor/variableDeclarator.ts（VariableDeclaratorTypeClass）— definite

- 分類: A
- 今の型: `id: Identifier | ArrayPattern | ObjectPattern | VoidPattern; definite: boolean | null; init: Expression | null`
- 問題: `let x!: T` の definite を書けるのは、id が Identifier で init がないときだけ。今の型では、`definite: true` で id が ObjectPattern のもの、init があるものも書けてしまう。
- 直し方の案: `{ definite: true; id: IdentifierTypeClass; init: null } | { definite: false; id: IdentifierTypeClass | ArrayPatternTypeClass | ObjectPatternTypeClass; init: ExpressionTypeClass | null }`

#### VoidPatternTypeClass を含む union（variableDeclarator.id・PatternLikeTypeClass・PatternTypeClass・FunctionParameterTypeClass）

- 分類: D
- 問題: VoidPattern は discardBinding プラグインがないと出てこないので、LWC では使われない。
- 直し方の案: union と pair の一覧から VoidPatternTypeClass を外す。

#### expressionVisitor/index.ts（ExpressionTypeClass）

- 分類: D
- 今の型: Babel の Expression の別名をそのまま写していて、TypeCastExpression（Flow）・JSXElement・JSXFragment・BindExpression・DoExpression・ModuleExpression・TopicReference も含む。
- 問題: どれも LWC のパーサでは出てこない。ExpressionTypeClass はほぼすべての子の型に使われているので、使う側の分岐に、出てこない 7 種類が入り込む。
- 直し方の案: この 7 種類を外す（bindExpression.ts・doExpression.ts・moduleExpression.ts・topicReference.ts のクラスと pair も外す）。

#### statementVisitor/index.ts（StatementTypeClass）・declarationVisitor/index.ts（DeclarationTypeClass）

- 分類: D
- 今の型: Flow の DeclareClass・DeclareFunction・DeclareInterface・DeclareModule・DeclareModuleExports・DeclareTypeAlias・DeclareOpaqueType・DeclareVariable・DeclareExportDeclaration・DeclareExportAllDeclaration・InterfaceDeclaration・OpaqueType・TypeAlias・EnumDeclaration の 14 種類を含む。
- 問題: どれも出てこない。また、InterfaceDeclaration（Flow）と TSInterfaceDeclaration が同じ union にあり、取り違えやすい。
- 直し方の案: この 14 種類を外す。

#### expressionWrapperVisitor/index.ts（ExpressionWrapperTypeClass）

- 分類: D
- 問題: TypeCastExpression は出てこない。
- 直し方の案: `ExpressionStatementTypeClass | ParenthesizedExpressionTypeClass` に絞る。

#### immutableVisitor/index.ts（ImmutableTypeClass）・userWhitespacableVisitor/index.ts（UserWhitespacableTypeClass）

- 分類: D
- 今の型: Immutable は JSX のノード 10 種類、UserWhitespacable は Flow の ObjectType* 5 種類を含む。
- 問題: どれも出てこない。
- 直し方の案: Immutable はリテラル 5 種類に、UserWhitespacable は `ObjectMethodTypeClass | ObjectPropertyTypeClass` に絞る。

#### flow*・enumBodyVisitor・enumMemberVisitor・jsxVisitor・miscellaneousVisitor（フォルダごと）

- 分類: D
- 問題: これらのフォルダのノードは LWC では作られないのに、型がほかのフィールドの union に入り込んでいる。例: `PlaceholderFields.typeAnnotation` は `TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null` で、Flow と TS は instanceof でしか区別できない。commons 側の returnType・typeParameters にも、同じく Flow と TS が混ざった union がある。
- 直し方の案: LWC 用の IR からこれらのノードを外し、各フィールドを TS だけの型にする（例: `returnType: TSTypeAnnotationTypeClass | null`）。

#### tsTypeVisitor/index.ts（TSTypeTypeClass）

- 分類: D
- 問題: 決まった位置にしか出てこないノードが含まれている。
    - TSClassImplements・TSInterfaceHeritage は implements・extends にしか出てこない。
    - TSTypePredicate は関数の戻り値の型注釈にしか出てこない。
    - TSOptionalType・TSRestType・TSNamedTupleMember はタプルの要素にしか出てこない。

    それなのに、TSTypeAnnotation.typeAnnotation・TSTypeParameter.constraint・TSTypeParameterInstantiation.params がすべて同じ型なので、`<T extends ?string>` のようなありえない木も書けてしまう。

- 直し方の案: TSTypeTypeClass からこれらを外し、戻り値用の `TSReturnTypeTypeClass` と、タプルの要素用の `TSTupleElementTypeClass` を別に作る。

#### standardizedVisitor/classBody.ts（ClassBodyTypeClass）と、別名の union 全般

- 分類: D
- 問題: 判別のための `type` が private の field の中にしかないので、ClassBody.body の 8 種類も含め、どの union も instanceof でしか絞り込めず、`never` による網羅の確かめもできない。また、`.js` のファイルでは TSDeclareMethod・TSIndexSignature は出てこない。
- 直し方の案: 基底クラスに `readonly kind: TName` を公開する。

#### （全体）.js と .ts で出てくるノードが違う

- 分類: D
- 問題: `.js` のファイルでは TS のノードは出てこないが、Expression・Statement・LVal・PatternLike・ClassBody の型は、ファイルの言語に関係なく TS のノードを含む。
- 直し方の案: File・Program に `language: 'js' | 'ts'` を持たせ、言語でジェネリックにする。そこまでしない場合は JSDoc に書く（優先度は低い）。

#### E（閉じた値の集合なのに string・boolean | null）

- **tSDeclareMethod.ts**: `abstract`・`override`・`optional` が `boolean | null` → `boolean`。`access` は `accessibility` と同じ情報の旧い名前で、2 つが食い違う状態も書けてしまうので消す。
- **tSParameterProperty.ts**: `readonly`・`override` が `boolean | null` → `boolean`。
- **tSTypeParameter.ts**: `in`・`out`・`const` が `boolean | null` → `variance: 'none' | 'in' | 'out' | 'inout'; const: boolean`。
- **variableDeclarator.ts**: `definite` が `boolean | null` → `boolean`。

## 6. 対応の結果（2026-11-09）

5 章の項目は、下の「後回しにしたもの」を除いて直した。型チェック（src・テスト）はエラー 0 件、全テスト 454 件が成功。

### 確かめたこと

| 確かめたこと                                                                                                              | 結果                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| サンプル（Apex 28・LWC 10 ファイル）と、それを壊したもの（合わせて 877 件）を v2 で解析                                   | 外に出た例外 0 件。構文エラーがないのに IR のエラーが出たもの 0 件 |
| node_modules などの JS / TS 600 ファイル（LWC ではないが、正しいコードでエラーにならないかを見るため）を LWC の v2 で解析 | IR のエラー 0 件、例外 0 件                                        |

この確かめで見つかって直したもの:

- WHERE・SOSL の条件（whereLogicalExpression・logicalExpression）で、条件が 1 つだけの形（文法は `cond (AND cond)*`）を例外にしていた。演算子なしの形 `{ operator: null; operand }` を足した（5.1 の「2 つ以上」は誤りだった）。
- キーの hash が BigInt（`10n`）を JSON にできず、ファイル全体を作れなかった（[commons/ir.ts](../src/analyzer/types/commons/ir.ts)）。
- `++`・`--` の対象に、TS の `x!`・`x as T`・`x satisfies T`・`<T>x` と括弧の式を受け付けていなかった（[updateExpression.ts](../src/analyzer/types/lwc_IR_v2/commons/updateExpression.ts)）。

### 提案と違う形にしたもの

- 判別のフィールドは `kind` にそろえた（fieldList は `kind: 'field' | 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT'`、usingScope は `{ kind: 'scope' } | { kind: 'unknown' }`）。Babel の判別のフィールド（`computed`・`operator`・`asserts`・`selfClosing` など）はそのまま使う。
- objectProperty は、式と分割代入の 2 つの型には分けていない（Babel のノードからは文脈が分からず、汎用の Visitor の pair の一覧を文脈ごとに変える必要があるため）。computed と key、shorthand の連動は直した。
- classProperty・classAccessorProperty の型注釈は `annotation: { kind: 'ts'; ... } | { kind: 'flow'; ... } | null` にまとめた（ほかのノードの型注釈は後回し）。
- regExpLiteral の flags は `{ hasIndices; global; ignoreCase; multiline; dotAll; unicode: 'none' | 'unicode' | 'unicodeSets'; sticky }`。
- class・function の宣言の id は型引数で表した（ふつうは名前が要り、export default のときだけ null を許す）。
- for-in・for-of の左辺の宣言は、新しいノード `forHeadDeclaration` にした（IR の出力の型名が変わる）。
- ambient（`declare namespace` などの中）では `const x: T;` が正しい TS なので、const は「初期化子がある」か「初期化子のない識別子」を許した。
- Apex の `bitNotExpression` は、apex-parser の文法の名前に合わせてクラスの名前を残した（中身は XOR とコメントに書いた）。
- this・super・void.class の値は小文字にそろえた。
- 非推奨の別名のクラス（restProperty・spreadProperty・regexLiteral・numberLiteral）は消した（Babel 8 では作られない）。

### 後回しにしたもの（変更が多くのファイルに広がるため）

- 関数の引数の rest を分ける（5.3 の「全体: 関数の params」）。
- 識別子を、参照・束縛・引数の 3 つに分ける（5.3 の「全体: identifier・…」）。あわせて objectPattern の decorators・optional。
- Flow と TS の型注釈をまとめる（classProperty・classAccessorProperty を除く）。class の TS・Flow のフィールドのまとまり、call・new の typeArguments、declare のクラスのデコレータもこれと一緒に扱う。
- `.js` と `.ts` で出てくるノードの型を分ける。
- tSTupleType の、省略できる要素の順番と rest の数。tSIndexSignature の引数の型注釈を必須にする件。

### 気をつけること

- 型で決まっている形に合わない木（errorRecovery で回復した壊れた AST など）は、IrBuildError になり、resolvedError に出る（解析木には残らない）。構文エラーがあるファイルでは、リスナーは構文エラーだけを出す。
- v1 とはフィールドの形が違うので、v1 と同じ木になるかの比較（[ir-v2.md](./ir-v2.md) 4.2）はもう使えない。v2 の確かめは、v2 の木そのものをテストで見る。
