# Apex JSON：単位・宣言・修飾子・メタデータ

[全体の目次と共通の形](./apex-json-types.md)。18 型別名。表の型名は定義へのリンク。

## 宣言・トリガー

| 型 | `kind` / 基底 | 対応する Apex・用途 | 主な属性 |
| --- | --- | --- | --- |
| [ClassDeclarationJson](../src/analyzer/types/apex/declaration.ts#L149) | `class` / Structure | `class C { ... }` | `name`, `block`, `extend?`, `implement?` |
| [InterfaceDeclarationJson](../src/analyzer/types/apex/declaration.ts#L113) | `interface` / Structure | `interface I { ... }` | `name`, `block?`, `extend?` |
| [EnumDeclarationJson](../src/analyzer/types/apex/declaration.ts#L195) | `enum` / Structure | `enum Color { RED, BLUE }` | `name`, `members?` |
| [EnumConstantJson](../src/analyzer/types/apex/declaration.ts#L187) | `enumConstant` / Json | enum 内の `RED` など個々の定数 | `name` |
| [MethodDeclarationJson](../src/analyzer/types/apex/declaration.ts#L66) | `method` / Structure | クラスの `String f(Integer x) { ... }` | `name`, `returnType`, `param`, `block?` |
| [InterfaceMethodJson](../src/analyzer/types/apex/declaration.ts#L88) | `interfaceMethod` / Structure | インターフェースの `String f(Integer x);` | `name`, `returnType`, `param`, `modifier` |
| [ConstructorDeclarationJson](../src/analyzer/types/apex/declaration.ts#L274) | `constructor` / Structure | `C(Integer x) { ... }` | `name`（名前の配列）, `param`, `block` |
| [PropertyDeclarationJson](../src/analyzer/types/apex/declaration.ts#L216) | `property` / Structure | `String name { get; set; }` | `name`, `variantType`, `isGetter`, `getterContent?`, `isSetter`, `setterContent?` |
| [FieldDeclarationJson](../src/analyzer/types/apex/declaration.ts#L259) | `field` / Json | `Integer a = 1, b = 2;` の項目宣言全体 | `variantType`, `variants` |
| [VariantJson](../src/analyzer/types/apex/declaration.ts#L52) | `variant` / Json | 項目・ローカル変数の各名前と初期値。上の `a = 1` など | `name`, `init?` |
| [InitializerBlockJson](../src/analyzer/types/apex/declaration.ts#L131) | `initializer` / Json | クラス内の `static { ... }` または `{ ... }` | `block`, `isStatic` |
| [NotSetBlockJson](../src/analyzer/types/apex/declaration.ts#L136) | `notSet` / Json | クラス本体の単独の `;`（空の宣言） | 追加属性なし |
| [TriggerCaseJson](../src/analyzer/types/apex/unit.ts#L66) | `triggerCase` / Json | トリガーの `before insert`、`after update` など | `timing`, `actionType` |

`Structure` は `StructureJsonType`、`Json` は `JsonType` の略。宣言に付く修飾子は、親の生成処理で宣言ノードに `modifier` を追加する場合がある。抽象メソッドは `block` がない。`AccessorContentJson` は `get` / `set` の内容を持つ **kind なし**の入れ物。

## 型・引数・修飾子

| 型 | `kind` / 基底 | 対応する Apex・用途 | 主な属性 |
| --- | --- | --- | --- |
| [ParameterJson](../src/analyzer/types/apex/param.ts#L8) | `parameter` / Json | メソッド・コンストラクタの仮引数 `String name` | `variant`, `variantType`, `modifier` |
| [ModifierJson](../src/analyzer/types/apex/modifier.ts#L23) | `modifier` / Json | `public`, `static`, `with sharing` など | `name` |
| [AnnotationJson](../src/analyzer/types/apex/modifier.ts#L17) | `annotation` / Json | `@IsTest`, `@RestResource(urlMapping='/a')` | `name`, `arg?` |

`ModifiersJson` は `keyword?` と `annotation?` の配列を持つ kind なしの入れ物。`AnnotationArgJson` も kind なしで、名前付き引数の `key?` とリテラルの `value` を持つ。変数や戻り値の `TypeJson` は [型と式](./apex-json-types-expressions.md) を参照。

## メタデータ XML

| 型 | `kind` / 基底 | 対応するファイル・要素 | 主な属性 |
| --- | --- | --- | --- |
| [ApexClassMetaJson](../src/analyzer/types/apex/meta.ts#L33) | `apexClassMeta` / Json | `.cls-meta.xml` の `<ApexClass>` | `apiVersion?`, `status?`, `packageVersions?` |
| [ApexTriggerMetaJson](../src/analyzer/types/apex/meta.ts#L36) | `apexTriggerMeta` / Json | `.trigger-meta.xml` の `<ApexTrigger>` | 同上 |

`PackageVersionJson` は `namespace`、`majorNumber?`、`minorNumber?` を持つ kind なしの入れ物。

## 単位の入れ物

| 型 | 対応 | 形 |
| --- | --- | --- |
| [CompilationUnitJson](../src/analyzer/types/apex/unit.ts#L98) | クラス・インターフェース・enum のファイル | `fileType: 'cls'` とトップレベル宣言・`modifier`。宣言の `kind`・`sourceKeys` を持つ |
| [TriggerUnitJson](../src/analyzer/types/apex/unit.ts#L82) | トリガー | `fileType: 'trigger'`, `name`, `object`, `case`, `block`。入れ物自体は kind なし |
| [AnonymousUnitJson](../src/analyzer/types/apex/unit.ts#L50) | 匿名 Apex | `fileType: 'anonymous'`, `block`。入れ物自体は kind なし |

`MemberDeclarationJson` はメソッド・型・項目などの共用体。`BlockMemberJson` はトリガー／匿名 Apex 内の宣言または文の共用体。これら自体は新しい `kind` を追加しない。
