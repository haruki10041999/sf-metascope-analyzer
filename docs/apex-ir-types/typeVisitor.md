# typeVisitor

型参照（`String`、`System.Type`、`List<String>`、`String[]` など）と、型に付く配列次元 `[]` を扱う。

## Visitor

`TypeVisitor` が扱う Context と生成する TypeClass:

| visit メソッド | Context | 生成する TypeClass |
| --- | --- | --- |
| `visitArraySubscripts` | `ArraySubscriptsContext` | `ArraySubscriptsTypeClass` |
| `visitTypeRef` | `TypeRefContext` | `TypeRefTypeClass` |

## 基底クラス（base.ts）

### `TypeTypeClass<T>`

値を 1 つ持つ型系ノードの基底。

| 変数 | 型 | 内容 |
| --- | --- | --- |
| `type` | `string` | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 主値。変換失敗時は `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `TypeListBaseTypeClass<T>`

値の配列を持つ型系ノードの基底。

| 変数 | 型 | 内容 |
| --- | --- | --- |
| `type` | `string` | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列。各要素は変換失敗時に `ErrorTypeClass` |

ゲッター: `getValue()`, `getType()`（継承）

### `TypeAllTypeClass`

`TypeTypeClass<unknown> | TypeListBaseTypeClass<unknown>` の union 型。

### `isTypeTypeAll`

`TypeTypeClass` または `TypeListBaseTypeClass` のインスタンスかを判定するガード（`TypeAllTypeClass` に絞り込む）。

## TypeClass

### `TypeRefTypeClass`（typeRef.ts）

- **type**: `'typeRef'`
- **継承**: `TypeListBaseTypeClass<TypeNameTypeClass>`
- **元 Context**: `TypeRefContext`（文法: `typeName (DOT typeName)* arraySubscripts`）
- **役割**: ドット区切りの型名列と配列次元からなる型参照。ジェネリクスは各 `typeName` の `generic` に入る。

| 変数 | 型 | 内容 |
| --- | --- | --- |
| `type` | `'typeRef'` | 継承 |
| `value` | `(TypeNameTypeClass \| ErrorTypeClass)[]` | ドットで区切られた型名の配列（`System.Type` → 2 要素）。1 個以上 |
| `dimension` | `ArraySubscriptsTypeClass \| ErrorTypeClass` | 配列次元。配列でなくても `value: 0` のノードが入る（null にはならない） |

ゲッター: `getValue()`, `getDimension()`

例:
```apex
System.Type stringType = String.class;
List<String> names;
```
```json
{
  "type": "typeRef",
  "value": [
    { "type": "typeName", "value": { "type": "id", "value": "System" }, "generic": null },
    { "type": "typeName", "value": { "type": "id", "value": "Type" }, "generic": null }
  ],
  "dimension": { "type": "arraySubscripts", "value": 0 }
}
```
```json
{
  "type": "typeRef",
  "value": [
    {
      "type": "typeName",
      "value": "list",
      "generic": { "type": "typeArguments", "value": { "type": "typeList", "value": [ "..." ] } }
    }
  ],
  "dimension": { "type": "arraySubscripts", "value": 0 }
}
```

### `ArraySubscriptsTypeClass`（arraySubscripts.ts）

- **type**: `'arraySubscripts'`
- **継承**: `TypeTypeClass<number>`
- **元 Context**: `ArraySubscriptsContext`（文法: `(LBRACK RBRACK)*`）
- **役割**: 型名の後ろに付く `[]` の個数（配列の次元数）。

| 変数 | 型 | 内容 |
| --- | --- | --- |
| `type` | `'arraySubscripts'` | 継承 |
| `value` | `number` | `[]` の個数。配列でない型は `0`。`[` と `]` の数が一致しない場合は生成時に例外となり、親側で `ErrorTypeClass` に置き換わる |

ゲッター: `getValue()`

例:
```apex
private String[] stringArray;
```
```json
{
  "type": "typeRef",
  "value": [ { "type": "typeName", "value": { "type": "id", "value": "String" }, "generic": null } ],
  "dimension": { "type": "arraySubscripts", "value": 1 }
}
```
