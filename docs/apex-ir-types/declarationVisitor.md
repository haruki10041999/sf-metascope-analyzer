# declarationVisitor

型・メンバー・ローカル変数などの宣言を扱う。トップレベル型宣言、クラス本体内の宣言、クラス/インターフェース/enum 宣言、メソッド・コンストラクタ・フィールド・プロパティ宣言、ローカル変数宣言を IR に変換する。
子フィールドは変換失敗時に `ErrorTypeClass`（`type: 'AnalyzerError'`, `contextType` / `context` / `errorMessage`）になり得る。`modifier` 要素（modifierVisitor の `NormalModifierTypeClass`）の `value` は `'GLOBAL'` / `'PUBLIC'` / `'PROTECTED'` / `'PRIVATE'` / `'TRANSIENT'` / `'STATIC'` / `'ABSTRACT'` / `'FINAL'` / `'WEBSERVICE'` / `'OVERRIDE'` / `'VIRTUAL'` / `'TESTMETHOD'` / `'WITH_SHARING'` / `'WITHOUT_SHARING'` / `'INHERITED_SHARING'` またはアノテーション（`AnnotationTypeClass`）。

## Visitor

`DeclarationVisitor` が扱う Context と生成する TypeClass:

| visit メソッド                    | Context                             | 生成する TypeClass                    |
| --------------------------------- | ----------------------------------- | ------------------------------------- |
| `visitMemberDeclaration`          | `MemberDeclarationContext`          | `MemberDeclarationTypeClass`          |
| `visitLocalVariableDeclaration`   | `LocalVariableDeclarationContext`   | `LocalVariableDeclarationTypeClass`   |
| `visitClassDeclaration`           | `ClassDeclarationContext`           | `ClassDeclarationTypeClass`           |
| `visitClassBodyDeclaration`       | `ClassBodyDeclarationContext`       | `ClassBodyDeclarationTypeClass`       |
| `visitEnumDeclaration`            | `EnumDeclarationContext`            | `EnumDeclarationTypeClass`            |
| `visitConstructorDeclaration`     | `ConstructorDeclarationContext`     | `ConstructorDeclarationTypeClass`     |
| `visitInterfaceMethodDeclaration` | `InterfaceMethodDeclarationContext` | `InterfaceMethodDeclarationTypeClass` |
| `visitInterfaceDeclaration`       | `InterfaceDeclarationContext`       | `InterfaceDeclarationTypeClass`       |
| `visitFieldDeclaration`           | `FieldDeclarationContext`           | `FieldDeclarationTypeClass`           |
| `visitPropertyDeclaration`        | `PropertyDeclarationContext`        | `PropertyDeclarationTypeClass`        |
| `visitMethodDeclaration`          | `MethodDeclarationContext`          | `MethodDeclarationTypeClass`          |
| `visitTypeDeclaration`            | `TypeDeclarationContext`            | `TypeDeclarationTypeClass`            |
| `visitTriggerMemberDeclaration`   | `TriggerMemberDeclarationContext`   | `TriggerMemberDeclarationTypeClass`   |
| `visitAnonymousMemberDeclaration` | `AnonymousMemberDeclarationContext` | `AnonymousMemberDeclarationTypeClass` |
| `visitEnumConstants`              | `EnumConstantsContext`              | `EnumConstantsTypeClass`              |

## 基底クラス（base.ts）

### `DeclarationTypeClass<T>`

単一の子ノードを `value` に持つ宣言ノードの基底。多くのサブクラスでは `value` が宣言名（`id`）。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 子ノード                               |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `DeclarationListTypeClass<T>`

子ノードの配列を `value` に持つ宣言ノードの基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 子ノードの配列                         |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `DeclarationAllTypeClass`

`DeclarationTypeClass<unknown> | DeclarationListTypeClass<unknown>` の union 型。`DeclarationVisitor` の戻り値型に使う。

### `isDeclarationTypeAll`

`target` が `DeclarationTypeClass` または `DeclarationListTypeClass` のインスタンスかを判定するガード。

## TypeClass

### `TypeDeclarationTypeClass`（typeDeclaration.ts）

- **type**: `'typeDeclaration'`
- **継承**: `DeclarationTypeClass<TypeDeclarationClassType>`
- **元 Context**: `TypeDeclarationContext`（文法: `modifier* classDeclaration | modifier* enumDeclaration | modifier* interfaceDeclaration`）
- **役割**: ファイルのトップレベル型宣言と、その修飾子（アノテーション含む）。`TypeDeclarationClassType` は `ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass` の export された型エイリアス。

| 変数       | 型                                              | 内容                                                                       |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `type`     | `'typeDeclaration'`                             | 継承                                                                       |
| `value`    | `TypeDeclarationClassType \| ErrorTypeClass`    | `classDeclaration` / `enumDeclaration` / `interfaceDeclaration` のいずれか |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]` | 型の修飾子。無ければ `[]`                                                  |

ゲッター: `getValue()`（継承）, `getModifier()`。ガード: `isTypeDeclarationType`

例:

```apex
@IsTest(SeeAllData=false isParallel=true)
global inherited sharing virtual class ParserTest extends BaseParser implements ParserInterface, Comparable { ... }
```

```json
{
    "type": "typeDeclaration",
    "value": {
        "type": "classDeclaration",
        "value": { "type": "id", "value": "ParserTest" },
        "body": "...",
        "extend": "...",
        "implement": "..."
    },
    "modifier": [
        { "type": "modifier", "value": { "type": "annotation", "...": "..." } },
        { "type": "modifier", "value": "GLOBAL" },
        "..."
    ]
}
```

### `ClassDeclarationTypeClass`（classDeclaration.ts）

- **type**: `'classDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `ClassDeclarationContext`（文法: `CLASS id (EXTENDS typeRef)? (IMPLEMENTS typeList)? classBody`）
- **役割**: クラス宣言（トップレベル・内部クラスとも）。

| 変数        | 型                                            | 内容                                                               |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `type`      | `'classDeclaration'`                          | 継承                                                               |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`         | クラス名（`id`）                                                   |
| `body`      | `ClassBodyTypeClass \| ErrorTypeClass`        | クラス本体（bodyVisitor の `classBody`）                           |
| `extend`    | `TypeRefTypeClass \| ErrorTypeClass \| null`  | 親クラス（`typeRef`）。`extends` が無ければ `null`                 |
| `implement` | `TypeListTypeClass \| ErrorTypeClass \| null` | 実装インターフェース（`typeList`）。`implements` が無ければ `null` |

ゲッター: `getValue()`（継承）, `getBody()`, `getExtend()`, `getImplement()`。ガード: `isClassDeclarationType`

例:

```apex
public class CustomException extends Exception {
}
```

```json
{
    "type": "classDeclaration",
    "value": { "type": "id", "value": "CustomException" },
    "body": { "type": "classBody", "value": [] },
    "extend": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "...": "..." }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "implement": null
}
```

### `InterfaceDeclarationTypeClass`（interfaceDeclaration.ts）

- **type**: `'interfaceDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `InterfaceDeclarationContext`（文法: `INTERFACE id (EXTENDS typeList)? interfaceBody`）
- **役割**: インターフェース宣言。

| 変数     | 型                                            | 内容                                                              |
| -------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `type`   | `'interfaceDeclaration'`                      | 継承                                                              |
| `value`  | `NormalIdTypeClass \| ErrorTypeClass`         | インターフェース名（`id`）                                        |
| `body`   | `InterfaceBodyTypeClass \| ErrorTypeClass`    | 本体（bodyVisitor の `interfaceBody`）                            |
| `extend` | `TypeListTypeClass \| ErrorTypeClass \| null` | 継承元インターフェース（`typeList`）。`extends` が無ければ `null` |

ゲッター: `getValue()`（継承）, `getBody()`, `getExtend()`。ガード: `isInterfaceDeclarationType`

例:

```apex
public interface ExtendedHandler extends Handler, Comparable {
    String describe(Integer level, List<String> tags);
}
```

```json
{
    "type": "interfaceDeclaration",
    "value": { "type": "id", "value": "ExtendedHandler" },
    "body": {
        "type": "interfaceBody",
        "value": [{ "type": "interfaceMethodDeclaration", "...": "..." }]
    },
    "extend": {
        "type": "typeList",
        "value": [
            { "type": "typeRef", "...": "..." },
            { "type": "typeRef", "...": "..." }
        ]
    }
}
```

### `EnumDeclarationTypeClass`（enumDeclaration.ts）

- **type**: `'enumDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `EnumDeclarationContext`（文法: `ENUM id LBRACE enumConstants? RBRACE`）
- **役割**: enum 宣言。

| 変数       | 型                                                 | 内容                                              |
| ---------- | -------------------------------------------------- | ------------------------------------------------- |
| `type`     | `'enumDeclaration'`                                | 継承                                              |
| `value`    | `NormalIdTypeClass \| ErrorTypeClass`              | enum 名（`id`）                                   |
| `constant` | `EnumConstantsTypeClass \| ErrorTypeClass \| null` | 定数リスト。空 enum（`enum X {}`）の場合は `null` |

ゲッター: `getValue()`（継承）, `getConstant()`。ガード: `isEnumDeclarationType`

例:

```apex
enum EmptyEnum {}
```

```json
{ "type": "enumDeclaration", "value": { "type": "id", "value": "EmptyEnum" }, "constant": null }
```

### `EnumConstantsTypeClass`（enumConstants.ts）

- **type**: `'enumConstants'`
- **継承**: `DeclarationListTypeClass<NormalIdTypeClass>`
- **元 Context**: `EnumConstantsContext`（文法: `id (COMMA id)*`）
- **役割**: enum の定数名の並び。

| 変数    | 型                                        | 内容                 |
| ------- | ----------------------------------------- | -------------------- |
| `type`  | `'enumConstants'`                         | 継承                 |
| `value` | `(NormalIdTypeClass \| ErrorTypeClass)[]` | 定数名（`id`）の配列 |

ゲッター: `getValue()`（継承）。ガード: `isEnumConstantsType`

例:

```apex
public enum Status { AAA, BBB, CCC, DDD }
```

```json
{
    "type": "enumConstants",
    "value": [{ "type": "id", "value": "AAA" }, { "type": "id", "value": "BBB" }, "..."]
}
```

### `ClassBodyDeclarationTypeClass`（classBodyDeclaration.ts）

- **type**: `'classBodyDeclaration'`
- **継承**: `DeclarationTypeClass<MemberDeclarationTypeClass | NormalBlockTypeClass | null>`
- **元 Context**: `ClassBodyDeclarationContext`（文法: `SEMI | STATIC? block | modifier* memberDeclaration`）
- **役割**: クラス本体の 1 要素。修飾子付きメンバー宣言、static / インスタンス初期化子、空宣言 `;` のいずれか。

| 変数       | 型                                                                             | 内容                                                                                                           |
| ---------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `type`     | `'classBodyDeclaration'`                                                       | 継承                                                                                                           |
| `value`    | `MemberDeclarationTypeClass \| NormalBlockTypeClass \| ErrorTypeClass \| null` | メンバー宣言なら `memberDeclaration`、初期化子なら `block`。単独の `;` の場合は `null`                         |
| `modifier` | `(NormalModifierTypeClass \| ErrorTypeClass)[]`                                | メンバー宣言の修飾子。初期化子・`;` では `[]`                                                                  |
| `isStatic` | `boolean`                                                                      | `static { ... }` 初期化子のとき `true`。メンバー宣言の `static` 修飾子は `modifier` 側に入り、こちらは `false` |

ゲッター: `getValue()`（継承）, `getModifier()`, `getIsStatic()`。ガード: `isClassBodyDeclarationType`

例:

```apex
static {
    counter = 0;
}
;
```

```json
[
    {
        "type": "classBodyDeclaration",
        "value": { "type": "block", "value": [{ "type": "statement", "...": "..." }] },
        "modifier": [],
        "isStatic": true
    },
    { "type": "classBodyDeclaration", "value": null, "modifier": [], "isStatic": false }
]
```

### `MemberDeclarationTypeClass`（memberDeclaration.ts）

- **type**: `'memberDeclaration'`
- **継承**: `DeclarationTypeClass<MemberDeclarationTypeClassType>`（`MemberDeclarationTypeClassType` = `MethodDeclarationTypeClass | ConstructorDeclarationTypeClass | InterfaceDeclarationTypeClass | ClassDeclarationTypeClass | EnumDeclarationTypeClass | PropertyDeclarationTypeClass | FieldDeclarationTypeClass`、非 export）
- **元 Context**: `MemberDeclarationContext`（文法: `methodDeclaration | fieldDeclaration | constructorDeclaration | interfaceDeclaration | classDeclaration | enumDeclaration | propertyDeclaration`）
- **役割**: クラス本体内のメンバー宣言 1 つをラップする。

| 変数    | 型                                                 | 内容                                                                             |
| ------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `type`  | `'memberDeclaration'`                              | 継承                                                                             |
| `value` | `MemberDeclarationTypeClassType \| ErrorTypeClass` | 実際の宣言（method / constructor / interface / class / enum / property / field） |

ゲッター: `getValue()`（継承）。ガード: `isMemberDeclarationType`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{
    "type": "memberDeclaration",
    "value": {
        "type": "fieldDeclaration",
        "value": { "type": "variableDeclarators", "...": "..." },
        "valueType": { "type": "typeRef", "...": "..." }
    }
}
```

### `TriggerMemberDeclarationTypeClass`（triggerMemberDeclaration.ts）

- **type**: `'triggerMemberDeclaration'`
- **継承**: `DeclarationTypeClass<TriggerMemberDeclarationTypeClassType>`（`TriggerMemberDeclarationTypeClassType` = `MethodDeclarationTypeClass | InterfaceDeclarationTypeClass | ClassDeclarationTypeClass | EnumDeclarationTypeClass | PropertyDeclarationTypeClass | FieldDeclarationTypeClass`、非 export）
- **元 Context**: `TriggerMemberDeclarationContext`（文法: `methodDeclaration | fieldDeclaration | interfaceDeclaration | classDeclaration | enumDeclaration | propertyDeclaration`）
- **役割**: トリガー本体内のメンバー宣言 1 つをラップする（コンストラクタは含まない）。

| 変数    | 型                                                        | 内容                                                               |
| ------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `type`  | `'triggerMemberDeclaration'`                              | 継承                                                               |
| `value` | `TriggerMemberDeclarationTypeClassType \| ErrorTypeClass` | 実際の宣言（method / interface / class / enum / property / field） |

ゲッター: `getValue()`（継承）。ガード: `isTriggerMemberDeclarationType`

例:

```apex
private static final String PREFIX = 'Trigger: ';
```

```json
{
    "type": "triggerMemberDeclaration",
    "value": {
        "type": "fieldDeclaration",
        "value": { "type": "variableDeclarators", "value": ["..."] },
        "valueType": { "type": "typeRef", "...": "..." }
    }
}
```

### `AnonymousMemberDeclarationTypeClass`（anonymousMemberDeclaration.ts）

- **type**: `'anonymousMemberDeclaration'`
- **継承**: `DeclarationTypeClass<AnonymousMemberDeclarationTypeClassType>`（`AnonymousMemberDeclarationTypeClassType` = `MethodDeclarationTypeClass | ConstructorDeclarationTypeClass | InterfaceDeclarationTypeClass | ClassDeclarationTypeClass | EnumDeclarationTypeClass | PropertyDeclarationTypeClass | FieldDeclarationTypeClass`、非 export）
- **元 Context**: `AnonymousMemberDeclarationContext`（文法: `methodDeclaration | fieldDeclaration | interfaceDeclaration | classDeclaration | enumDeclaration | propertyDeclaration`）
- **役割**: 匿名 Apex 内のメンバー宣言 1 つをラップする。型には `ConstructorDeclarationTypeClass` を含むが、文法上コンストラクタは生成されない。匿名 Apex のトップレベル変数宣言（`Id accountId;` 等）もここに `fieldDeclaration` として入る。

| 変数    | 型                                                          | 内容                                                               |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `type`  | `'anonymousMemberDeclaration'`                              | 継承                                                               |
| `value` | `AnonymousMemberDeclarationTypeClassType \| ErrorTypeClass` | 実際の宣言（method / interface / class / enum / property / field） |

ゲッター: `getValue()`（継承）。ガード: `isAnonymousMemberDeclarationType`

例:

```apex
public class AnonymousHelper { ... }
```

```json
{
    "type": "anonymousMemberDeclaration",
    "value": {
        "type": "classDeclaration",
        "value": { "type": "id", "value": "AnonymousHelper" },
        "body": { "type": "classBody", "value": ["..."] },
        "extend": null,
        "implement": null
    }
}
```

### `MethodDeclarationTypeClass`（methodDeclaration.ts）

- **type**: `'methodDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `MethodDeclarationContext`（文法: `(typeRef | VOID) id formalParameters (block | SEMI)`）
- **役割**: メソッド宣言。

| 変数        | 型                                                    | 内容                                                                                                                |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`      | `'methodDeclaration'`                                 | 継承                                                                                                                |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`                 | メソッド名（`id`）                                                                                                  |
| `valueType` | `TypeRefTypeClass \| 'void' \| ErrorTypeClass`        | 戻り値型。`void` の場合は文字列 `'void'`                                                                            |
| `param`     | `FormalParametersTypeClass \| ErrorTypeClass \| null` | 引数（`formalParameters`）。文法上必須のため通常 `null` にならない（引数なしは `formalParameters.value` が `null`） |
| `block`     | `NormalBlockTypeClass \| ErrorTypeClass \| null`      | 本体。abstract メソッド等で本体が無い（`;` で終わる）場合は `null`                                                  |

ゲッター: `getValue()`（継承）, `getValueType()`, `getParam()`, `getBlock()`。ガード: `isMethodDeclarationType`

例:

```apex
public abstract void execute();
```

```json
{
    "type": "methodDeclaration",
    "value": { "type": "id", "value": "execute" },
    "valueType": "void",
    "param": { "type": "formalParameters", "value": null },
    "block": null
}
```

### `ConstructorDeclarationTypeClass`（constructorDeclaration.ts）

- **type**: `'constructorDeclaration'`
- **継承**: `DeclarationTypeClass<QualifiedNameTypeClass>`
- **元 Context**: `ConstructorDeclarationContext`（文法: `qualifiedName formalParameters block`）
- **役割**: コンストラクタ宣言。

| 変数    | 型                                                    | 内容                                                               |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `type`  | `'constructorDeclaration'`                            | 継承                                                               |
| `value` | `QualifiedNameTypeClass \| ErrorTypeClass`            | コンストラクタ名（`qualifiedName`）                                |
| `param` | `FormalParametersTypeClass \| ErrorTypeClass \| null` | 引数（`formalParameters`）。文法上必須のため通常 `null` にならない |
| `block` | `NormalBlockTypeClass \| ErrorTypeClass`              | 本体                                                               |

ゲッター: `getValue()`（継承）, `getParam()`, `getBlock()`。ガード: `isConstructorDeclarationType`

例:

```apex
public ParserTest(String name) {
    super();
    this.name = name;
}
```

```json
{
    "type": "constructorDeclaration",
    "value": { "type": "qualifiedName", "value": [{ "type": "id", "value": "ParserTest" }] },
    "param": {
        "type": "formalParameters",
        "value": { "type": "formalParameterList", "value": ["..."] }
    },
    "block": { "type": "block", "value": [{ "type": "statement", "...": "..." }, "..."] }
}
```

### `FieldDeclarationTypeClass`（fieldDeclaration.ts）

- **type**: `'fieldDeclaration'`
- **継承**: `DeclarationTypeClass<VariableDeclaratorsTypeClass>`
- **元 Context**: `FieldDeclarationContext`（文法: `typeRef variableDeclarators SEMI`）
- **役割**: フィールド宣言（1 文で複数の変数を宣言可能）。修飾子は親（`classBodyDeclaration` 等）の `modifier` に入る。

| 変数        | 型                                               | 内容                                                     |
| ----------- | ------------------------------------------------ | -------------------------------------------------------- |
| `type`      | `'fieldDeclaration'`                             | 継承                                                     |
| `value`     | `VariableDeclaratorsTypeClass \| ErrorTypeClass` | 宣言子の並び（variableVisitor の `variableDeclarators`） |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass`             | フィールドの型                                           |

ゲッター: `getValue()`（継承）, `getValueType()`。ガード: `isFieldDeclarationType`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{
    "type": "fieldDeclaration",
    "value": {
        "type": "variableDeclarators",
        "value": [
            {
                "type": "variableDeclarator",
                "value": { "type": "id", "value": "MAX_SIZE" },
                "content": { "type": "primaryExpression", "...": "..." }
            }
        ]
    },
    "valueType": {
        "type": "typeRef",
        "value": [
            { "type": "typeName", "value": { "type": "id", "value": "Integer" }, "generic": null }
        ],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    }
}
```

### `PropertyDeclarationTypeClass`（propertyDeclaration.ts）

- **type**: `'propertyDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `PropertyDeclarationContext`（文法: `typeRef id LBRACE propertyBlock* RBRACE`）
- **役割**: プロパティ宣言（`get` / `set` アクセサ付き）。

| 変数        | 型                                             | 内容                                                                       |
| ----------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `type`      | `'propertyDeclaration'`                        | 継承                                                                       |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`          | プロパティ名（`id`）                                                       |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass`           | プロパティの型                                                             |
| `block`     | `(PropertyBlockTypeClass \| ErrorTypeClass)[]` | アクセサ（blockVisitor の `propertyBlock`）の配列。アクセサが無ければ `[]` |

ゲッター: `getValue()`（継承）, `getValueType()`, `getBlock()`。ガード: `isPropertyDeclarationType`

例:

```apex
public String autoProperty { get; set; }
```

```json
{
    "type": "propertyDeclaration",
    "value": { "type": "id", "value": "autoProperty" },
    "valueType": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "...": "..." }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "block": [
        { "type": "propertyBlock", "value": { "type": "getter", "value": null }, "modifier": [] },
        { "type": "propertyBlock", "value": { "type": "setter", "value": null }, "modifier": [] }
    ]
}
```

### `InterfaceMethodDeclarationTypeClass`（interfaceMethodDeclaration.ts）

- **type**: `'interfaceMethodDeclaration'`
- **継承**: `DeclarationTypeClass<NormalIdTypeClass>`
- **元 Context**: `InterfaceMethodDeclarationContext`（文法: `modifier* (typeRef | VOID) id formalParameters SEMI`）
- **役割**: インターフェース内のメソッドシグネチャ。

| 変数        | 型                                                    | 内容                                                               |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `type`      | `'interfaceMethodDeclaration'`                        | 継承                                                               |
| `value`     | `NormalIdTypeClass \| ErrorTypeClass`                 | メソッド名（`id`）                                                 |
| `valueType` | `TypeRefTypeClass \| 'void' \| ErrorTypeClass`        | 戻り値型。`void` の場合は文字列 `'void'`                           |
| `param`     | `FormalParametersTypeClass \| ErrorTypeClass \| null` | 引数（`formalParameters`）。文法上必須のため通常 `null` にならない |
| `modifier`  | `(NormalModifierTypeClass \| ErrorTypeClass)[]`       | 修飾子。無ければ `[]`                                              |

ゲッター: `getValue()`（継承）, `getValueType()`, `getParam()`, `getModifier()`。ガード: `isInterfaceMethodDeclarationType`

例:

```apex
String describe(Integer level, List<String> tags);
```

```json
{
    "type": "interfaceMethodDeclaration",
    "value": { "type": "id", "value": "describe" },
    "valueType": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "...": "..." }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "param": {
        "type": "formalParameters",
        "value": { "type": "formalParameterList", "value": ["..."] }
    },
    "modifier": []
}
```

### `LocalVariableDeclarationTypeClass`（localVariableDeclaration.ts）

- **type**: `'localVariableDeclaration'`
- **継承**: `DeclarationTypeClass<VariableDeclaratorsTypeClass>`
- **元 Context**: `LocalVariableDeclarationContext`（文法: `modifier* typeRef variableDeclarators`）
- **役割**: メソッド本体等で使われるローカル変数宣言（`localVariableDeclarationStatement` などから参照される）。

| 変数        | 型                                               | 内容                                                     |
| ----------- | ------------------------------------------------ | -------------------------------------------------------- |
| `type`      | `'localVariableDeclaration'`                     | 継承                                                     |
| `value`     | `VariableDeclaratorsTypeClass \| ErrorTypeClass` | 宣言子の並び（variableVisitor の `variableDeclarators`） |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass`             | 変数の型                                                 |
| `modifier`  | `(NormalModifierTypeClass \| ErrorTypeClass)[]`  | 修飾子（`final` 等）。無ければ `[]`                      |

ゲッター: `getValue()`（継承）, `getValueType()`, `getModifier()`。ガード: `isLocalVariableDeclarationType`

例:

```apex
String result = 'x';
```

```json
{
    "type": "localVariableDeclaration",
    "value": {
        "type": "variableDeclarators",
        "value": [
            {
                "type": "variableDeclarator",
                "value": { "type": "id", "...": "..." },
                "content": { "type": "primaryExpression", "...": "..." }
            }
        ]
    },
    "valueType": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "value": { "type": "id", "...": "..." }, "generic": null }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    },
    "modifier": []
}
```
