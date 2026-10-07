# bodyVisitor

クラス本体（`classBody`）とインターフェース本体（`interfaceBody`）の `{ ... }` を扱う。本体内の宣言の並びを保持する。
子フィールドは変換失敗時に `ErrorTypeClass`（`type: 'AnalyzerError'`, `contextType` / `context` / `errorMessage`）になり得る。

## Visitor

`BodyVisitor` が扱う Context と生成する TypeClass:

| visit メソッド       | Context                | 生成する TypeClass       |
| -------------------- | ---------------------- | ------------------------ |
| `visitClassBody`     | `ClassBodyContext`     | `ClassBodyTypeClass`     |
| `visitInterfaceBody` | `InterfaceBodyContext` | `InterfaceBodyTypeClass` |

## 基底クラス（base.ts）

### `BodyTypeClass<T>`

本体内の宣言の配列を `value` に持つ基底。

| 変数    | 型                        | 内容                                   |
| ------- | ------------------------- | -------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承） |
| `value` | `(T \| ErrorTypeClass)[]` | 本体内の宣言の配列                     |

ゲッター: `getValue()`, `getType()`（CommonTypeClass）

### `isBodyTypeAll`

`target` が `BodyTypeClass<unknown>` のインスタンスかを判定するガード（union 型の定義は無く、`BodyVisitor` の戻り値型は `BodyTypeClass<unknown>`）。

## TypeClass

### `ClassBodyTypeClass`（classBody.ts）

- **type**: `'classBody'`
- **継承**: `BodyTypeClass<ClassBodyDeclarationTypeClass>`
- **元 Context**: `ClassBodyContext`（文法: `LBRACE classBodyDeclaration* RBRACE`）
- **役割**: クラス本体。フィールド・メソッド・コンストラクタ・プロパティ・内部型・初期化子などの宣言を並べる。

| 変数    | 型                                                    | 内容                                                                    |
| ------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `type`  | `'classBody'`                                         | 継承                                                                    |
| `value` | `(ClassBodyDeclarationTypeClass \| ErrorTypeClass)[]` | 各宣言（declarationVisitor の `classBodyDeclaration`）。空クラスは `[]` |

ゲッター: `getValue()`（継承）。ガード: `isClassBodyType`

例:

```apex
public class CustomException extends Exception {
}
```

```json
{ "type": "classBody", "value": [] }
```

### `InterfaceBodyTypeClass`（interfaceBody.ts）

- **type**: `'interfaceBody'`
- **継承**: `BodyTypeClass<InterfaceMethodDeclarationTypeClass>`
- **元 Context**: `InterfaceBodyContext`（文法: `LBRACE interfaceMethodDeclaration* RBRACE`）
- **役割**: インターフェース本体。メソッドシグネチャの並び。

| 変数    | 型                                                          | 内容                                                                              |
| ------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `type`  | `'interfaceBody'`                                           | 継承                                                                              |
| `value` | `(InterfaceMethodDeclarationTypeClass \| ErrorTypeClass)[]` | 各メソッド宣言（declarationVisitor の `interfaceMethodDeclaration`）。空なら `[]` |

ゲッター: `getValue()`（継承）。ガード: `isInterfaceBodyType`

例:

```apex
public interface Handler {
    void execute();
}
```

```json
{
    "type": "interfaceBody",
    "value": [
        {
            "type": "interfaceMethodDeclaration",
            "value": { "type": "id", "value": "execute" },
            "valueType": "void",
            "param": { "type": "formalParameters", "value": null },
            "modifier": []
        }
    ]
}
```
