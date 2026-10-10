# Apex Converter の独自型

`src/analyzer/types/apex/converter/` で定義・export される型の概要です。これらは Apex IR の `CommonTypeClass` 群そのものではなく、IR から変換して出力するオブジェクトの型です。公開エントリーポイントは `src/analyzer/types/apex/converter/index.ts` です。

## 読み方

- `?` の付いたプロパティは省略可能です。変換時に値が得られなかった場合、プロパティ自体を出力しないことがあります。
- `A | B` はどちらか一方の形を表します。`type` を持つUnionでは、その値で具体的な形を判別します。
- `TypeRef` はApexの型名・ジェネリック引数・配列次元を表します。
- `Expression` と `NormalStatement` は `type` 判別子を使う再帰的な構文木です。
- 下記のメンバー一覧は converter の型定義に基づきます。各変換関数が常に全フィールドへ値を設定することを意味するものではありません。

## 型・名前・値

### [type.ts](../src/analyzer/types/apex/converter/type.ts)

- `TypeRef`: `value: TypeName[]`, `dimension?: number`。型名と配列次元を表します。

### [name.ts](../src/analyzer/types/apex/converter/name.ts)

- `TypeName`: `value?: string`, `generic: TypeRef[]`。型名とジェネリック引数です。
- `DateFieldName`: `value: string[]`, `isConvertTimeZone: boolean`。SOQLの日付項目名とタイムゾーン変換指定です。

### [id.ts](../src/analyzer/types/apex/converter/id.ts)

このファイルにはIDをプリミティブな文字列へ変換する関数があります。独自のexport型エイリアスはありません。

### [literal.ts](../src/analyzer/types/apex/converter/literal.ts)

- `NormalLiteral`: `value?: string`, `valueType: string`。
- `WhenLiteral`: `value?: string | string[]`, `valueType: string`, `operator?: string`。
- `SoslLiteral`: `value?: string | Expression`, `soslClauses: SoslClauses`。
- `SoslLiteralAlt`: `value?: string`, `soslClauses: SoslClauses`。
- `SignedLiteral`: `value?: string`, `valueType: string`, `operator?: string`。符号付きリテラルです。

### [value.ts](../src/analyzer/types/apex/converter/value.ts)

- `NormalValue`: `value?: string | SignedLiteral | NormalValue[] | DateFormula | SubQuery | Expression`, `valueType: string`。リテラル値、式、日付式、サブクエリなどを包みます。
- `WhenValue`: `value?: string | WhenLiteral[]`, `valueType: TypeRef`。switchのwhen値です。

### [primary.ts](../src/analyzer/types/apex/converter/primary.ts)

- `Primary` は `type` 判別Unionです。
    - `normal`, `this`, `void`, `super`, `id`: `primary?: string`
    - `soql`: `primary: NormalQuery`
    - `typeRef`: `primary: TypeRef`
    - `literal`: `primary?: NormalLiteral`
    - `sosl`: `primary: SoslLiteral`

## 式・呼び出し・生成式

### [expression.ts](../src/analyzer/types/apex/converter/expression.ts)

- `Expression` は `type` 判別Unionです。
    - `normal`: `expression?: string`
    - `primary`: `expression?: Primary`
    - `dot`: `expression?: DotExpression`
    - `array`: `expression: Expression[]`
    - `methodCall`: `expression?: MethodCall`
    - `new`: `expression?: Creator`
    - `cast`: `expression?: CastExpression`
    - `sub`: `expression?: Expression`
    - `postOp`, `preOp`, `neg`: `expression?: SingleOperatorExpression`
    - `arth1`, `arth2`, `bit`, `cmp`, `equality`, `bitAnd`, `bitOr`, `bitNot`, `assign`, `logAnd`, `logOr`, `coal`: `expression?: ExpToExpOperatorClass`
    - `instanceOf`: `expression?: InstanceOfExpression`
    - `cond`: `expression?: CondExpression`
- `DotExpression`: `left?: Expression`, `operator?: string`, `right?: string | DotMethodCall`。メンバー参照・メソッド呼び出しを表します。
- `CastExpression`: `value?: Expression`, `valueType: TypeRef`。
- `SingleOperatorExpression`: `value?: Expression`, `operator: string`, `location: 'prefix' | 'postfix'`。
- `ExpToExpOperatorClass`: `left?: Expression`, `operator?: string`, `right?: Expression`。
- `InstanceOfExpression`: `left?: Expression`, `operator?: string`, `right: TypeRef`。
- `CondExpression`: `condition?: Expression`, `true?: Expression`, `false?: Expression`。三項演算子です。
- `FieldExpression`: `left?: string[] | SoqlFunction`, `operator?: string`, `right?: NormalValue`。SOQL条件項目です。
- `LogicalExpression`: `value: (LogicalExpression | FieldExpression)[]`, `operator?: string`。SOSL等の論理条件です。
- `WhereFieldExpression`: `left?: string | FieldExpression`, `operator?: string`, `right?: NormalValue`。SOQL WHERE項目です。
- `WhereLogicalExpression`: `value: (WhereLogicalExpression | WhereFieldExpression)[]`, `operator?: string`。SOQL WHEREの論理式です。

### [call.ts](../src/analyzer/types/apex/converter/call.ts)

- `MethodCall`: `value?: string`, `param: Expression[]`, `reference?: string`。
- `DotMethodCall`: `value?: string`, `param: Expression[]`。ドット式の右辺に置かれるメソッド呼び出しです。

### [rest.ts](../src/analyzer/types/apex/converter/rest.ts)

- `Creator` は `type` 判別Unionです。全ケースに `value: IdCreatedNamePair[]` があり、型名／生成対象を表します。
    - `array`: `content: ArrayCreatorRest`
    - `class`: `content: Expression[]`
    - `map`: `content: MapCreatorRestPair[]`
    - `no`: `content?: string`
    - `set`: `content: Expression[]`
- `ArrayCreatorRest`: `value: Expression[]`, `size?: Expression`。

### [pair.ts](../src/analyzer/types/apex/converter/pair.ts)

- `ElementValuePair`: `left?: string`, `right?: NormalLiteral`。アノテーション引数の名前・値です。
- `IdCreatedNamePair`: `left?: string`, `right: TypeRef[]`。生成式内の型名と追加の型情報です。
- `MapCreatorRestPair`: `left?: Expression`, `right?: Expression`。Map生成式のキー・値です。

### [arguments.ts](../src/analyzer/types/apex/converter/arguments.ts)

引数リストの変換関数を定義します。独自のexport型エイリアスはありません。メソッド引数は `Expression[]` として表します。

## 宣言・メンバー・修飾子

### [declaration.ts](../src/analyzer/types/apex/converter/declaration.ts)

- `TypeDeclaration` はトップレベル宣言の判別Unionです。各ケースは `type`、対応する `value`、`modifier: NormalModifier[]` を持ちます。
    - `class`: `value: ClassDeclaration`
    - `enum`: `value: EnumDeclaration`
    - `interface`: `value: InterfaceDeclaration`
- `MemberDeclaration` は `method`, `constructor`, `interface`, `class`, `enum`, `property`, `field` の判別Unionです。それぞれ対応する宣言を `member` に格納します。
- `AnonymousMemberDeclaration` は匿名ブロック内の宣言Unionで、`MemberDeclaration` から `constructor` を除いた形です。
- `TriggerMemberDeclaration` はトリガー内の宣言Unionで、`MemberDeclaration` から `constructor` を除いた形です。
- `ClassBodyDeclaration`: `value?: MemberDeclaration | NormalStatement[]`, `modifier: NormalModifier[]`, `isStatic?: boolean`。クラスのメンバーまたは初期化ブロックです。
- `ClassDeclaration`: `value?: string`, `body: ClassBodyDeclaration[]`, `extend: TypeRef`, `implement: TypeRef[]`。
- `ConstructorDeclaration`: `value: string[]`, `param: FormalParameter[]`, `block: NormalStatement[]`。
- `EnumDeclaration`: `value?: string`, `constant: string[]`。
- `FieldDeclaration`: `value: VariableDeclarator[]`, `valueType: TypeRef`。
- `InterfaceDeclaration`: `value?: string`, `body: InterfaceMethodDeclaration[]`, `extend: TypeRef[]`。
- `InterfaceMethodDeclaration`: `value?: string`, `valueType?: TypeRef | 'void'`, `param: FormalParameter[]`, `modifier: NormalModifier[]`。
- `LocalVariableDeclaration`: `value: VariableDeclarator[]`, `valueType: TypeRef`, `modifier: NormalModifier[]`。
- `MethodDeclaration`: `value?: string`, `valueType?: TypeRef | 'void'`, `param: FormalParameter[]`, `block: NormalStatement[]`。
- `PropertyDeclaration`: `value?: string`, `valueType: TypeRef`, `block: PropertyBlock[]`。

### [member.ts](../src/analyzer/types/apex/converter/member.ts)

- `AnonymousBlockMember`: `value?: AnonymousMemberDeclaration | NormalStatement`, `modifier: NormalModifier[]`。
- `TriggerBlockMember`: `value?: TriggerMemberDeclaration | NormalStatement`, `modifier: NormalModifier[]`。

### [block.ts](../src/analyzer/types/apex/converter/block.ts)

- `PropertyBlock`: `type?: 'getter' | 'setter'`, `value: NormalStatement[]`, `modifier: NormalModifier[]`。

### [modifier.ts](../src/analyzer/types/apex/converter/modifier.ts)

- `NormalModifier` は次の判別Unionです。
    - `modifier`: `value: string`。アクセス修飾子などです。
    - `annotation`: `value?: Annotation`
- `Annotation`: `value?: string`, `param?: NormalLiteral | ElementValuePair[]`。

### [parameter.ts](../src/analyzer/types/apex/converter/parameter.ts)

- `FormalParameter`: `value?: string`, `valueType: TypeRef`, `modifier: NormalModifier[]`。

### [variable.ts](../src/analyzer/types/apex/converter/variable.ts)

- `VariableDeclarator`: `value?: string`, `content?: Expression`。変数名と任意の初期化式です。

## 文・制御フロー

### [statement.ts](../src/analyzer/types/apex/converter/statement.ts)

- `NormalStatement` は文の `type` 判別Unionです。
    - `block`: `statement: NormalStatement[]`
    - `if`: `statement: IfStatement`
    - `switch`: `statement: SwitchStatement`
    - `for`: `statement: ForStatement`
    - `while`: `statement: WhileStatement`
    - `doWhile`: `statement: DoWhileStatement`
    - `try`: `statement: TryStatement`
    - `return`, `expression`, `throw`: `statement?: Expression`
    - `break`, `continue`: `statement?: string`
    - `insert`, `update`, `delete`, `undelete`: `statement: DmlStatement`
    - `upsert`: `statement: UpsertStatement`
    - `merge`: `statement: MergeStatement`
    - `runAs`: `statement: RunAsStatement`
    - `localVariable`: `statement: LocalVariableDeclaration`
- `IfStatement`: `{ value?: Expression | 'else'; block?: NormalStatement }[]`。if/else-if/elseの連なりです。
- `ForStatement`: `value: ForControl`, `block?: NormalStatement`。
- `WhileStatement`: `value?: Expression`, `block?: NormalStatement`。
- `DoWhileStatement`: `value?: Expression`, `block: NormalStatement[]`。
- `SwitchStatement`: `value?: Expression`, `block: WhenControl[]`。
- `TryStatement`: `value: NormalStatement[]`, `catchBlock: CatchClause[]`, `finallyBlock: NormalStatement[]`。
- `DmlStatement`: `value?: Expression`, `accessLevel?: string`。
- `UpsertStatement`: `value?: Expression`, `accessLevel?: string`, `key: string[]`。
- `MergeStatement`: `value: Expression[]`, `accessLevel?: string`。
- `RunAsStatement`: `value: Expression[]`, `block: NormalStatement[]`。

### [control.ts](../src/analyzer/types/apex/converter/control.ts)

- `ForControl`: `value?: EnhancedForControl | Expression`, `init?: LocalVariableDeclaration | Expression[]`, `update: Expression[]`。
- `EnhancedForControl`: `value?: string`, `valueType: TypeRef`, `fromVariant?: Expression`。拡張forの変数と反復元です。
- `WhenControl`: `value: WhenValue`, `block: NormalStatement[]`。

### [clause.ts](../src/analyzer/types/apex/converter/clause.ts)

- `CatchClause`: `value?: string`, `valueType: string[]`, `block: NormalStatement[]`, `modifier: NormalModifier[]`。
- `WhenClause`: `value: string[]`, `field: string[][]`。TYPEOF式のwhen分岐です。
- `TypeOf`: `value: string[]`, `whenClause: WhenClause[]`, `elseClause: string[][]`。
- `WithClause`: `value?: string | LogicalExpression`, `field: DataCategorySelection[]`。
- `DataCategorySelection`: `value?: string`, `selector?: string`, `category: string[]`。
- `FieldOrder`: `value?: string[] | SoqlFunction`, `direction?: string`, `nulls?: string`。
- `GroupByClause`: `value: (string[] | SoqlFunction)[]`, `mode?: string`, `having: LogicalExpression`。
- `SoslClauses`: `value?: string`, `fieldSpecList: FieldSpec[]`, `withList: SoslWithClause[]`, `limitClause?: string | Expression`, `updateList: string[]`。
- `SoslWithClause`: `value?: string`, `content?: string | string[] | Expression | DataCategorySelection[]`。

## SOQL・SOSL

### [query.ts](../src/analyzer/types/apex/converter/query.ts)

- `NormalQuery`: SELECT項目 `value: SelectEntry[]`、`from: FromName[]` と、`forClause: string[]`, `whereClause: WhereLogicalExpression`, `orderByClause: FieldOrder[]`, `limitClause?: string | Expression`, `updateList: string[]`, `usingScope?: string`, `withClause: WithClause`, `groupByClause: GroupByClause`, `offsetClause?: string | Expression`, `allRowsClause?: string` を持ちます。
- `SubQuery`: `value: SubFieldEntry[]`, `from: FromName[]`, `forClause: string[]`, `whereClause: WhereLogicalExpression`, `orderByClause: FieldOrder[]`, `limitClause?: string | Expression`, `updateList: string[]`。
- `FieldSpec`: `value: string[]`, `fieldList: SoslField[]`, `where: LogicalExpression`, `listView: string[]`, `orderBy: FieldOrder[]`, `limitClause?: string | Expression`, `offsetClause?: Expression`。SOSLのRETURNING指定です。
- `SoqlFunction`: `value?: string`, `param?: string[] | DateFieldName | string | SoqlFunction | (string | string[] | (SignedLiteral | Expression)[] | string[] | Expression)[]`。
- `DateFormula`: `value?: string`, `param?: SignedLiteral`。

### [entry.ts](../src/analyzer/types/apex/converter/entry.ts)

- `SelectEntry`: `value?: string[] | SoqlFunction | SubQuery | TypeOf`, `alias?: string`。
- `SubFieldEntry`: `value?: string[] | SoqlFunction | SubQuery | TypeOf`, `alias?: string`。サブクエリ内SELECT項目です。

### [list.ts](../src/analyzer/types/apex/converter/list.ts)

- `SoslField`: `value?: string[] | SoqlFunction`, `func?: string`。
- `FromName`: `value: string[]`, `alias?: string`。FROM対象と任意の別名です。

## ファイル単位の入力・出力

### [unit.ts](../src/analyzer/types/apex/converter/unit.ts)

- `TriggerCase`: `value?: string`, `triggerCaseType: string`。
- `TriggerUnit`: `value: string[]`, `triggerCase: TriggerCase[]`, `block: TriggerBlockMember[]`。
- コンパイル単位は `TypeDeclaration`、匿名実行単位は `AnonymousBlockMember[]` を返します。これらの型はこのファイルでは別名として再定義せず、宣言・メンバーの型を利用しています。

## 変換関数と補助ファイル

次のファイルは変換関数を提供します。追加の公開型エイリアスは定義していません。

- [body.ts](../src/analyzer/types/apex/converter/body.ts): クラス／インターフェース本体
- [commons.ts](../src/analyzer/types/apex/converter/commons.ts): IR値の型チェックとプリミティブ値取り出し
- [id.ts](../src/analyzer/types/apex/converter/id.ts): ID値
- [arguments.ts](../src/analyzer/types/apex/converter/arguments.ts): 引数リスト
- [index.ts](../src/analyzer/types/apex/converter/index.ts): converter型・関数の再export
