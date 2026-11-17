# レポートのカタログ

版: 1。このファイルは src/report/llmCatalog.ts から作ったもの (npm run catalog)。手で直さない。

## 書き方の決まり

- レポートは 1 つの JSON の文書 (title・data・spec) で書く。spec は json-render の仕様 (root と、キー → 要素の平らな elements)。
- data は「名前 → { provider, args }」。ビルドが provider を実行して、結果を state の /data/<名前> に入れる。
- データの部品 (DataTable・StatusSummary) の rows には、行を書かずに { "$state": "/data/<名前>" } だけを書く。数値・一覧を自分で書かない。
- データの部品には、受け取れる形 (shape) か provider のデータだけを渡せる (rows → DataTable・StatusSummary、matrix → Matrix、flow.diagram → FlowDiagram など。provider の「描ける部品」を見る)。
- DataTable で showSource: true にするときは、そのデータの宣言に withSource: true を付ける (行にソースの抜き出しが付く)。
- どの要素も type・props・children を持つ (子がなければ children は [])。props は部品のスキーマのとおりに、すべてのキーを書く (使わないものは null)。
- AI が書くのは、Narrative の markdown (要約・リスクの説明・レビューの指摘)・見出し・Alert の文言と、どのデータをどの部品で見せるかの選択だけ。
- レポートの既定は「今の状態のすべて」(1 時点。行に status はない)。ドキュメント・コードの理解のためのレポートはこれで書く。
- 差分を見るときだけ、文書に diff: true (保存した基準 → 作業ツリー) か compare ({ "from": "main" } は main...作業ツリー、{ "from": "main", "to": "HEAD" } は main...HEAD) を書く。行に status (added・removed・changed・unchanged) が付き、DataTable の onlyChanged で変わった行だけにできる。
- requiresComparison の provider (差分だけを返すもの) は、diff か compare がないと使えない。

## 部品の一覧

| 部品 | 説明 | データ |
| --- | --- | --- |
| `Card` | Container card for content sections. Use for forms/content boxes, NOT for page headers. | — |
| `Stack` | Flex container for layouts | — |
| `Grid` | Grid layout (1-6 columns) | — |
| `Separator` | Visual separator line | — |
| `Tabs` | Tab navigation. Use { $bindState } on value for active tab binding. | — |
| `Accordion` | Collapsible sections. Items as [{title, content}]. Type 'single' (default) or 'multiple'. | — |
| `Heading` | Heading text (h1-h4) | — |
| `Text` | Paragraph text | — |
| `Badge` | Status badge | — |
| `Alert` | Alert banner | — |
| `Narrative` | Markdown text written by the AI (summary, explanation, review comments). | — |
| `DataTable` | Table of rows from a report provider. The status column (added/removed/changed/unchanged) is shown as a colored badge. | rows |
| `StatusSummary` | Counts of rows by status (added/removed/changed/unchanged) from a report provider, shown as small cards. | rows |
| `Matrix` | Permission matrix (objects or fields x permission sets / profiles). Changed cells show before -> after. | data |
| `FlowDiagram` | Diagram of flow elements and connectors. Added / removed / changed elements are colored. | data |
| `ObjectDiagram` | Entity relationship diagram of objects (lookup / master-detail), colored by change when comparing. | data |
| `LwcWireframe` | Wireframe of Lightning web components from their templates: base components drawn as simple shapes, branches as tabs, loops once with a count mark, child components expandable. | data |
| `DiagramText` | Source text of a dependency diagram (Mermaid or DOT), shown as a code block. | data |
| `LayoutView` | Page layouts: sections and fields (with moves), related lists and actions, colored by change. | data |
| `FlexiPageView` | Lightning pages: regions and their components / fields, colored by change. | data |
| `AutomationView` | Automation of each object: record-triggered flows (with order), Apex triggers, validation rules. | data |
| `ImpactView` | Changed units and the units impacted by them (following dependents), as two tables. | data |

## provider の一覧

| provider | 形 | 描ける部品 | 説明 |
| --- | --- | --- | --- |
| `object.list` | rows | DataTable・StatusSummary | オブジェクトの一覧 (ラベル・種類・共有設定・項目・入力規則・レコードタイプの数)。オブジェクト定義書の目次。 |
| `object.fields` | rows | DataTable・StatusSummary | 項目の一覧 (型・必須・長さ・参照先・数式・積み上げ集計・選択リスト・ヘルプ)。暗黙の標準項目 (Id・CreatedDate など) も含む。比べるときは変わったプロパティの名前と、選択リスト値の並び順の変化を付ける。 |
| `object.picklists` | rows | DataTable・StatusSummary | 選択リスト値 (定義の順・ラベル・既定・有効・色・連動する制御項目の値)。グローバル値セットを使う項目は値セットの名前。 |
| `object.validationRules` | rows | DataTable・StatusSummary | 入力規則 (有効・エラー条件の数式・エラーメッセージ・表示する項目)。 |
| `object.recordTypePicklists` | rows | DataTable・StatusSummary | レコードタイプごとに選べる選択リスト値と既定値。 |
| `translation.coverage` | rows | DataTable・StatusSummary | オブジェクトの翻訳の網羅 (オブジェクト × 言語ごとの、訳あり・未訳・翻訳元と同じ・対象がない・古い翻訳の件数と割合)。既定はすべての言語。 |
| `translation.items` | rows | DataTable・StatusSummary | 翻訳する項目ごとの翻訳元・訳・状態 (項目のラベル・ヘルプ・選択リスト値・入力規則のメッセージなど)。statuses で未訳 (missing) だけなどに絞れる。古い翻訳 (outdated) は比べるときだけ分かる。 |
| `object.diagram` | diagram | ObjectDiagram | オブジェクトの ER 図 (参照・主従関係と項目)。objects で起点を選ぶと、そこから depth 段 (両方向) にたどったものに絞る。 |
| `permission.diffs` | rows | DataTable・StatusSummary | 権限セット・プロファイルの変更 (オブジェクト・項目・Apex・カスタム権限・システム権限の行ごとに、変わった値)。 (比べる時点が要る) |
| `permission.objectAccess` | matrix | Matrix | 権限セット・プロファイル × オブジェクトの CRUD の行列。 |
| `permission.fieldAccess` | matrix | Matrix | 権限セット・プロファイル × 項目の参照・編集の行列。 |
| `permission.apexAccess` | rows | DataTable・StatusSummary | 権限セット・プロファイルが実行できる Apex クラス・Visualforce ページ。 |
| `permission.effective` | rows | DataTable・StatusSummary | 権限セットグループ (ミュートを含む) が実際に与える権限。 |
| `flow.list` | rows | DataTable・StatusSummary | Flow の一覧 (種類・起動条件・対象オブジェクト・状態・要素の数)。 |
| `flow.diagram` | diagram | FlowDiagram | Flow の要素と接続の図 (差分の status 付き)。 |
| `flow.diffs` | rows | DataTable・StatusSummary | Flow の要素・資源・起動の変更 (変わったプロパティの名前)。 (比べる時点が要る) |
| `flow.references` | rows | DataTable・StatusSummary | Flow が参照する項目・Apex・サブフロー・LWC・ラベル (参照先がなければ problem に指摘)。 |
| `flow.interface` | rows | DataTable・StatusSummary | Flow の入力・出力の変数。前回と比べると、増えた・減った・変わった入出力が分かる (サブフロー・Apex からの呼び出しへの影響)。 |
| `apex.outline` | rows | DataTable・StatusSummary | Apex のクラス・トリガーのすべてのクラス・メンバー (メソッド・コンストラクタ・プロパティ・項目・内側の型。private とテストも) と、トリガーの対象とイベント。コードの理解・クラスの仕様書のため。外から使えるものだけは apex.interface。 |
| `apex.dataAccess` | rows | DataTable・StatusSummary | Apex がどこで (クラス・メソッド) どのオブジェクト・項目を読み書きするか (SOQL・SOSL・動的なクエリ・DML)。ループの中か (ガバナ制限の原因になりやすい)・テストの中かも出す。DML の項目は、同じメソッドで代入している項目。 |
| `apex.interface` | rows | DataTable・StatusSummary | Apex の外から使えるクラス・メンバー (global・public・@AuraEnabled など)。前回と比べると、公開メソッドの追加・削除・引数や戻り値の型の変化が分かる。 |
| `lwc.components` | rows | DataTable・StatusSummary | LWC のコンポーネントの一覧 (ラベル・公開先・@api・発行するイベント・使う子コンポーネントと基本コンポーネント・Apex・オブジェクト・突き合わせの指摘の数)。コンポーネント一覧のドキュメントのため。 |
| `lwc.detail` | rows | DataTable・StatusSummary | LWC のコンポーネントの中身 (親から使える @api・メソッド・イベント・slot、@wire とアダプター、Apex のメソッド、使うコンポーネント、オブジェクトと項目、ラベルなどの import、突き合わせの指摘)。1 行 1 項目。 |
| `lwc.wireframe` | diagram | LwcWireframe | LWC の画面の骨組み (ワイヤーフレーム)。テンプレートから描き、JS は実行しない。分岐 (lwc:if など) はタブ、繰り返し (for:each) は 1 件分、子コンポーネントは展開して入れ子に描く。画面の仕様書のため。 |
| `lwc.interface` | rows | DataTable・StatusSummary | LWC の親から使えるもの (@api のプロパティ・メソッド、発行するイベント、slot)。前回と比べると、増えた・減ったものが分かる。 |
| `automation.byObject` | object | AutomationView | オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則) と順序。 |
| `layout.detail` | object | LayoutView | ページレイアウトのセクションと項目・関連リスト・アクション (差分付き)。 |
| `flexiPage.detail` | object | FlexiPageView | Lightning ページのリージョンと部品 (LWC・標準の部品) とプロパティ。 |
| `lwc.placements` | rows | DataTable・StatusSummary | LWC がどの Lightning ページのどのリージョンに置かれているか。 |
| `crossRef.labels` | rows | DataTable・StatusSummary | カスタム表示ラベルの使われている場所 (Apex・LWC・Flow など) と未使用のラベル。 |
| `crossRef.references` | rows | DataTable・StatusSummary | 参照先 (項目・クラス・コンポーネントなど) ごとの、参照している単位 (逆引き)。 |
| `metadata.findings` | rows | DataTable・StatusSummary | 解析の指摘 (権限・ラベル・Flow・画面・参照)。前回と比べると、新しく出た指摘は added、なくなった指摘は removed。 |
| `dependency.dependents` | rows | DataTable・StatusSummary | ノードを使っているもの (逆引き。「この項目を使っているもの」)。 |
| `dependency.dependencies` | rows | DataTable・StatusSummary | ノードが使っているもの。 |
| `dependency.impact` | object | ImpactView | 前回から変わった単位と、それを使っているため影響を受ける単位。 (比べる時点が要る) |
| `dependency.missing` | rows | DataTable・StatusSummary | リポジトリにない参照先 (存在しない項目・クラス・コンポーネント・ラベルなど)。 |
| `dependency.unused` | rows | DataTable・StatusSummary | ほかから使われていないもの (掃除の候補)。 |
| `dependency.changes` | rows | DataTable・StatusSummary | 前回と比べた、依存の増減 (メンバーの細かさ)。 (比べる時点が要る) |
| `dependency.graph` | diagram | DiagramText | 依存関係の図 (Mermaid か DOT の文字列。単位の細かさ)。 |

## 文書のスキーマ

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "diff": {
      "description": "true compares the saved baseline with the working tree (rows get status). Omit for a report of the current state (everything, no status).",
      "type": "boolean"
    },
    "compare": {
      "description": "Two points of git to compare (e.g. { \"from\": \"main\" } for main...working tree). Takes precedence over diff.",
      "type": "object",
      "properties": {
        "from": {
          "type": "string",
          "minLength": 1,
          "description": "Base revision (branch, tag or commit), e.g. main or origin/main."
        },
        "to": {
          "description": "Target revision. Omit (or WORKTREE) for the working tree.",
          "type": "string",
          "minLength": 1
        },
        "mergeBase": {
          "description": "true (default) compares from the point where to branched off from (like main...HEAD). false compares from itself.",
          "type": "boolean"
        }
      },
      "required": [
        "from"
      ]
    },
    "data": {
      "type": "object",
      "propertyNames": {
        "type": "string",
        "pattern": "^[A-Za-z][A-Za-z0-9_]*$"
      },
      "additionalProperties": {
        "type": "object",
        "properties": {
          "provider": {
            "type": "string",
            "minLength": 1,
            "description": "Report provider name (list_report_providers)."
          },
          "args": {
            "description": "Arguments of the provider.",
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {}
          },
          "withSource": {
            "description": "true adds a source excerpt (_source) to each row that has a position (for DataTable showSource).",
            "type": "boolean"
          }
        },
        "required": [
          "provider"
        ]
      },
      "description": "Data used by the spec. Each key is bound as { \"$state\": \"/data/<key>\" }."
    },
    "spec": {
      "type": "object",
      "properties": {
        "root": {
          "type": "string"
        },
        "elements": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string"
              },
              "props": {
                "type": "object",
                "propertyNames": {
                  "type": "string"
                },
                "additionalProperties": {}
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "visible": {}
            },
            "required": [
              "type",
              "props"
            ]
          }
        }
      },
      "required": [
        "root",
        "elements"
      ],
      "description": "json-render spec (root and flat elements)."
    }
  },
  "required": [
    "title",
    "data",
    "spec"
  ]
}
```

## 部品

### Card

Container card for content sections. Use for forms/content boxes, NOT for page headers.

props:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": [
        "string",
        "null"
      ]
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "maxWidth": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "sm",
            "md",
            "lg",
            "full"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "centered": {
      "type": [
        "boolean",
        "null"
      ]
    },
    "className": {
      "description": "Additional CSS classes",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "title",
    "description",
    "maxWidth",
    "centered",
    "className"
  ]
}
```

### Stack

Flex container for layouts

props:

```json
{
  "type": "object",
  "properties": {
    "direction": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "horizontal",
            "vertical"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "gap": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "none",
            "sm",
            "md",
            "lg",
            "xl"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "align": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "stretch"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "justify": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "between",
            "around"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "className": {
      "description": "Additional CSS classes",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "direction",
    "gap",
    "align",
    "justify",
    "className"
  ]
}
```

### Grid

Grid layout (1-6 columns)

props:

```json
{
  "type": "object",
  "properties": {
    "columns": {
      "type": [
        "number",
        "null"
      ]
    },
    "gap": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "sm",
            "md",
            "lg",
            "xl"
          ]
        },
        {
          "type": "null"
        }
      ]
    },
    "className": {
      "description": "Additional CSS classes",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "columns",
    "gap",
    "className"
  ]
}
```

### Separator

Visual separator line

props:

```json
{
  "type": "object",
  "properties": {
    "orientation": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "horizontal",
            "vertical"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "orientation"
  ]
}
```

### Tabs

Tab navigation. Use { $bindState } on value for active tab binding.

props:

```json
{
  "type": "object",
  "properties": {
    "tabs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string"
          },
          "value": {
            "type": "string"
          }
        },
        "required": [
          "label",
          "value"
        ]
      }
    },
    "defaultValue": {
      "type": [
        "string",
        "null"
      ]
    },
    "value": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "tabs",
    "defaultValue",
    "value"
  ]
}
```

### Accordion

Collapsible sections. Items as [{title, content}]. Type 'single' (default) or 'multiple'.

props:

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "content": {
            "type": "string"
          }
        },
        "required": [
          "title",
          "content"
        ]
      }
    },
    "type": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "single",
            "multiple"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "items",
    "type"
  ]
}
```

### Heading

Heading text (h1-h4)

props:

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    },
    "level": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "h1",
            "h2",
            "h3",
            "h4"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "text",
    "level"
  ]
}
```

### Text

Paragraph text

props:

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    },
    "variant": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "body",
            "caption",
            "muted",
            "lead",
            "code"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "text",
    "variant"
  ]
}
```

### Badge

Status badge

props:

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string"
    },
    "variant": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "default",
            "secondary",
            "destructive",
            "outline"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "text",
    "variant"
  ]
}
```

### Alert

Alert banner

props:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "message": {
      "type": [
        "string",
        "null"
      ]
    },
    "type": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "info",
            "success",
            "warning",
            "error"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "title",
    "message",
    "type"
  ]
}
```

### Narrative

Markdown text written by the AI (summary, explanation, review comments).

props:

```json
{
  "type": "object",
  "properties": {
    "markdown": {
      "type": "string",
      "description": "Text written by the AI (summary, risks, review comments) in Markdown. Raw HTML is not rendered. Do not copy numbers or lists from the data here; bind the data with DataTable / StatusSummary instead."
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "markdown",
    "title"
  ]
}
```

### DataTable

Table of rows from a report provider. The status column (added/removed/changed/unchanged) is shown as a colored badge.

データを受け取るプロパティ: `rows`

props:

```json
{
  "type": "object",
  "properties": {
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      },
      "description": "Rows from a report provider. Never write rows yourself: bind them with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "columns": {
      "anyOf": [
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "key": {
                "type": "string"
              },
              "label": {
                "type": "string"
              }
            },
            "required": [
              "key",
              "label"
            ]
          }
        },
        {
          "type": "null"
        }
      ],
      "description": "Columns to show (key of the row and its header). null shows every column."
    },
    "caption": {
      "type": [
        "string",
        "null"
      ]
    },
    "onlyChanged": {
      "description": "true hides rows whose status is unchanged (only when comparing; a one-point report shows all).",
      "type": [
        "boolean",
        "null"
      ]
    },
    "showSource": {
      "description": "true adds an expandable source excerpt to each row. The data must be declared with withSource: true.",
      "type": [
        "boolean",
        "null"
      ]
    }
  },
  "required": [
    "rows",
    "columns",
    "caption",
    "onlyChanged"
  ]
}
```

### StatusSummary

Counts of rows by status (added/removed/changed/unchanged) from a report provider, shown as small cards.

データを受け取るプロパティ: `rows`

props:

```json
{
  "type": "object",
  "properties": {
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      },
      "description": "Rows from a report provider. Never write rows yourself: bind them with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "rows",
    "title"
  ]
}
```

### Matrix

Permission matrix (objects or fields x permission sets / profiles). Changed cells show before -> after.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Matrix (rows x permission holders) from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "onlyChanged": {
      "description": "true hides rows without any change (only when comparing; a one-point report shows all).",
      "type": [
        "boolean",
        "null"
      ]
    }
  },
  "required": [
    "data",
    "onlyChanged"
  ]
}
```

### FlowDiagram

Diagram of flow elements and connectors. Added / removed / changed elements are colored.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Flow diagrams from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "flow": {
      "description": "Flow API name to show. null shows every flow in the data.",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "data",
    "flow"
  ]
}
```

### ObjectDiagram

Entity relationship diagram of objects (lookup / master-detail), colored by change when comparing.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Object ER diagram from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "showAllFields": {
      "description": "true lists every field in each box. Default (null) shows only relation fields.",
      "type": [
        "boolean",
        "null"
      ]
    }
  },
  "required": [
    "data",
    "showAllFields"
  ]
}
```

### LwcWireframe

Wireframe of Lightning web components from their templates: base components drawn as simple shapes, branches as tabs, loops once with a count mark, child components expandable.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "LWC wireframes from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "component": {
      "description": "Component to show (c/accountList). null shows every root in the data.",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "data",
    "component"
  ]
}
```

### DiagramText

Source text of a dependency diagram (Mermaid or DOT), shown as a code block.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Diagram text (Mermaid or DOT) from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    },
    "title": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "data",
    "title"
  ]
}
```

### LayoutView

Page layouts: sections and fields (with moves), related lists and actions, colored by change.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Page layouts from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    }
  },
  "required": [
    "data"
  ]
}
```

### FlexiPageView

Lightning pages: regions and their components / fields, colored by change.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Lightning pages from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    }
  },
  "required": [
    "data"
  ]
}
```

### AutomationView

Automation of each object: record-triggered flows (with order), Apex triggers, validation rules.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Automation by object from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    }
  },
  "required": [
    "data"
  ]
}
```

### ImpactView

Changed units and the units impacted by them (following dependents), as two tables.

データを受け取るプロパティ: `data`

props:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "description": "Change impact from a report provider. Never write the data yourself: bind it with { \"$state\": \"/data/<name>\" }, where <name> is a key of the document data."
    }
  },
  "required": [
    "data"
  ]
}
```

## provider

### object.list

オブジェクトの一覧 (ラベル・種類・共有設定・項目・入力規則・レコードタイプの数)。オブジェクト定義書の目次。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string",
        "description": "API name."
      },
      "label": {
        "type": "string"
      },
      "pluralLabel": {
        "type": "string"
      },
      "objectType": {
        "type": "string",
        "description": "standard / custom / customMetadata / platformEvent / bigObject / externalObject."
      },
      "description": {
        "type": "string"
      },
      "sharingModel": {
        "type": "string"
      },
      "deploymentStatus": {
        "type": "string"
      },
      "customSettingsType": {
        "type": "string"
      },
      "fieldCount": {
        "type": "number",
        "description": "Fields defined in metadata (without implicit standard fields)."
      },
      "validationRuleCount": {
        "type": "number"
      },
      "recordTypeCount": {
        "type": "number"
      }
    },
    "required": [
      "object",
      "objectType",
      "fieldCount",
      "validationRuleCount",
      "recordTypeCount"
    ],
    "additionalProperties": false,
    "description": "One object (custom / standard object, custom metadata type, platform event)."
  }
}
```

### object.fields

項目の一覧 (型・必須・長さ・参照先・数式・積み上げ集計・選択リスト・ヘルプ)。暗黙の標準項目 (Id・CreatedDate など) も含む。比べるときは変わったプロパティの名前と、選択リスト値の並び順の変化を付ける。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "includeImplicit": {
      "description": "false hides implicit standard fields (Id, CreatedDate ...). Default true.",
      "type": "boolean"
    }
  }
}
```

例:

```json
{
  "objects": [
    "Invoice__c"
  ]
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string"
      },
      "field": {
        "type": "string",
        "description": "API name of the field."
      },
      "origin": {
        "type": "string",
        "enum": [
          "metadata",
          "implicit"
        ],
        "description": "implicit: standard fields every object has (Id, CreatedDate ...) without a file."
      },
      "label": {
        "type": "string"
      },
      "type": {
        "description": "Salesforce field type (Text, Lookup, Picklist ...).",
        "type": "string"
      },
      "required": {
        "type": "boolean"
      },
      "unique": {
        "type": "boolean"
      },
      "externalId": {
        "type": "boolean"
      },
      "length": {
        "type": "number"
      },
      "precision": {
        "type": "number"
      },
      "scale": {
        "type": "number"
      },
      "referenceTo": {
        "description": "Referenced object of a Lookup / MasterDetail.",
        "type": "string"
      },
      "relationshipName": {
        "type": "string"
      },
      "deleteConstraint": {
        "type": "string"
      },
      "formula": {
        "description": "Formula of a formula field (as text).",
        "type": "string"
      },
      "defaultValue": {
        "description": "Default value formula (as text).",
        "type": "string"
      },
      "summary": {
        "description": "Roll-up summary: operation(summarized field) on the child object.",
        "type": "string"
      },
      "valueSetName": {
        "description": "Global value set of a picklist.",
        "type": "string"
      },
      "picklistValueCount": {
        "type": "number"
      },
      "picklistOrderChanged": {
        "description": "The order of picklist values changed (only when comparing).",
        "type": "boolean",
        "const": true
      },
      "helpText": {
        "type": "string"
      },
      "description": {
        "type": "string"
      }
    },
    "required": [
      "object",
      "field",
      "origin"
    ],
    "additionalProperties": false,
    "description": "One field of an object."
  }
}
```

### object.picklists

選択リスト値 (定義の順・ラベル・既定・有効・色・連動する制御項目の値)。グローバル値セットを使う項目は値セットの名前。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "fields": {
      "description": "Field API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string"
      },
      "field": {
        "type": "string"
      },
      "value": {
        "description": "API name of the value. Absent for a global value set.",
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "order": {
        "description": "Position in the definition (1 based).",
        "type": "number"
      },
      "isDefault": {
        "type": "boolean"
      },
      "isActive": {
        "type": "boolean"
      },
      "color": {
        "type": "string"
      },
      "controllingField": {
        "type": "string"
      },
      "controllingValues": {
        "description": "Values of the controlling field that allow this value (dependent picklist).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "valueSetName": {
        "description": "Global value set (values are defined there).",
        "type": "string"
      }
    },
    "required": [
      "object",
      "field"
    ],
    "additionalProperties": false,
    "description": "One picklist value (in definition order)."
  }
}
```

### object.validationRules

入力規則 (有効・エラー条件の数式・エラーメッセージ・表示する項目)。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string"
      },
      "rule": {
        "type": "string"
      },
      "active": {
        "type": "boolean"
      },
      "condition": {
        "description": "Error condition formula (as text).",
        "type": "string"
      },
      "errorMessage": {
        "type": "string"
      },
      "errorDisplayField": {
        "type": "string"
      },
      "description": {
        "type": "string"
      }
    },
    "required": [
      "object",
      "rule"
    ],
    "additionalProperties": false,
    "description": "One validation rule."
  }
}
```

### object.recordTypePicklists

レコードタイプごとに選べる選択リスト値と既定値。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "object": {
        "type": "string"
      },
      "recordType": {
        "type": "string"
      },
      "recordTypeLabel": {
        "type": "string"
      },
      "active": {
        "type": "boolean"
      },
      "picklist": {
        "type": "string",
        "description": "Picklist field."
      },
      "values": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Values available in the record type."
      },
      "defaultValue": {
        "type": "string"
      }
    },
    "required": [
      "object",
      "recordType",
      "picklist",
      "values"
    ],
    "additionalProperties": false,
    "description": "Picklist values available in one record type."
  }
}
```

### translation.coverage

オブジェクトの翻訳の網羅 (オブジェクト × 言語ごとの、訳あり・未訳・翻訳元と同じ・対象がない・古い翻訳の件数と割合)。既定はすべての言語。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "languages": {
      "description": "Locales (ja, en_US ...) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string"
      },
      "language": {
        "type": "string",
        "description": "Locale (ja, en_US ...)."
      },
      "objectFound": {
        "type": "boolean",
        "description": "The object is in the repository (custom objects)."
      },
      "total": {
        "type": "number",
        "description": "Items to translate (labels, help, picklist values ...)."
      },
      "translated": {
        "type": "number"
      },
      "missing": {
        "type": "number"
      },
      "sameAsSource": {
        "type": "number"
      },
      "orphan": {
        "type": "number"
      },
      "outdated": {
        "type": "number"
      },
      "coverage": {
        "type": "number",
        "description": "Translated items / items of the object (0-100, rounded)."
      }
    },
    "required": [
      "object",
      "language",
      "objectFound",
      "total",
      "translated",
      "missing",
      "sameAsSource",
      "orphan",
      "outdated",
      "coverage"
    ],
    "additionalProperties": false,
    "description": "Translation coverage of one object in one language."
  }
}
```

### translation.items

翻訳する項目ごとの翻訳元・訳・状態 (項目のラベル・ヘルプ・選択リスト値・入力規則のメッセージなど)。statuses で未訳 (missing) だけなどに絞れる。古い翻訳 (outdated) は比べるときだけ分かる。

分類: object。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "languages": {
      "description": "Locales (ja, en_US ...) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "statuses": {
      "description": "Translation statuses to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "translated",
          "missing",
          "sameAsSource",
          "orphan",
          "outdated"
        ]
      }
    }
  }
}
```

例:

```json
{
  "statuses": [
    "missing",
    "sameAsSource"
  ]
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "object": {
        "type": "string"
      },
      "language": {
        "type": "string"
      },
      "kind": {
        "type": "string",
        "enum": [
          "fieldLabel",
          "fieldHelp",
          "relationshipLabel",
          "picklistValue",
          "validationRule",
          "recordType",
          "webLink",
          "fieldSet"
        ],
        "description": "What is translated."
      },
      "name": {
        "type": "string",
        "description": "Field API name, Field.Value for picklist values, or fullName."
      },
      "source": {
        "description": "Text in the object (source language).",
        "type": "string"
      },
      "translation": {
        "type": "string"
      },
      "translationStatus": {
        "type": "string",
        "enum": [
          "translated",
          "missing",
          "sameAsSource",
          "orphan",
          "outdated"
        ],
        "description": "translated / missing: no translation / sameAsSource: same text as the source (possibly forgotten) / orphan: translation of something the object does not have / outdated: the source changed but the translation did not (only when comparing)."
      }
    },
    "required": [
      "object",
      "language",
      "kind",
      "name",
      "translationStatus"
    ],
    "additionalProperties": false,
    "description": "One translatable item of an object in one language."
  }
}
```

### object.diagram

オブジェクトの ER 図 (参照・主従関係と項目)。objects で起点を選ぶと、そこから depth 段 (両方向) にたどったものに絞る。

分類: object。出力の形: diagram。描ける部品: ObjectDiagram

args:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "description": "Start object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "depth": {
      "description": "How many relations to follow from objects (default 1).",
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    }
  }
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "objects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "added",
              "removed",
              "changed",
              "unchanged"
            ],
            "description": "Change since the saved state (only when comparing two points)."
          },
          "name": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "objectType": {
            "type": "string"
          },
          "external": {
            "description": "Referenced but not in the repository (User etc.).",
            "type": "boolean",
            "const": true
          },
          "fields": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "status": {
                  "type": "string",
                  "enum": [
                    "added",
                    "removed",
                    "changed",
                    "unchanged"
                  ],
                  "description": "Change since the saved state (only when comparing two points)."
                },
                "name": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "referenceTo": {
                  "type": "string"
                }
              },
              "required": [
                "name"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "name",
          "objectType",
          "fields"
        ],
        "additionalProperties": false
      }
    },
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "added",
              "removed",
              "changed",
              "unchanged"
            ],
            "description": "Change since the saved state (only when comparing two points)."
          },
          "from": {
            "type": "string",
            "description": "Object that has the field."
          },
          "field": {
            "type": "string"
          },
          "to": {
            "type": "string",
            "description": "Referenced object."
          },
          "type": {
            "type": "string",
            "enum": [
              "Lookup",
              "MasterDetail"
            ]
          }
        },
        "required": [
          "from",
          "field",
          "to",
          "type"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "objects",
    "relations"
  ],
  "additionalProperties": false,
  "description": "Entity relationship diagram of objects (lookup / master-detail)."
}
```

### permission.diffs

権限セット・プロファイルの変更 (オブジェクト・項目・Apex・カスタム権限・システム権限の行ごとに、変わった値)。

分類: permission。出力の形: rows。描ける部品: DataTable・StatusSummary。**比べる時点が要る** (文書の diff か compare)

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "holder": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "permissionSet",
              "mutingPermissionSet",
              "profile",
              "permissionSetGroup"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "type",
          "name"
        ],
        "additionalProperties": false
      },
      "category": {
        "type": "string",
        "description": "XML element name (objectPermissions etc.). settings for root values, unit for added/removed sets."
      },
      "target": {
        "type": "string",
        "description": "Invoice__c / Invoice__c.Amount__c etc. Empty for settings and unit."
      },
      "changes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "before": {},
            "after": {}
          },
          "required": [
            "name"
          ],
          "additionalProperties": false,
          "description": "A changed property of the row."
        }
      }
    },
    "required": [
      "holder",
      "category",
      "target",
      "changes"
    ],
    "additionalProperties": false,
    "description": "One changed permission row of a permission set or profile."
  }
}
```

### permission.objectAccess

権限セット・プロファイル × オブジェクトの CRUD の行列。

分類: permission。出力の形: matrix。描ける部品: Matrix

args:

```json
{
  "type": "object",
  "properties": {
    "onlyChanged": {
      "description": "true returns only the changed rows (when comparing with diff / compare).",
      "type": "boolean"
    },
    "rows": {
      "description": "Objects to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "permissionSet",
              "mutingPermissionSet",
              "profile",
              "permissionSetGroup"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "type",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "cells": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "before": {
              "type": "object",
              "properties": {
                "allowCreate": {
                  "type": "boolean"
                },
                "allowRead": {
                  "type": "boolean"
                },
                "allowEdit": {
                  "type": "boolean"
                },
                "allowDelete": {
                  "type": "boolean"
                },
                "viewAllRecords": {
                  "type": "boolean"
                },
                "modifyAllRecords": {
                  "type": "boolean"
                },
                "viewAllFields": {
                  "type": "boolean"
                }
              },
              "required": [
                "allowCreate",
                "allowRead",
                "allowEdit",
                "allowDelete",
                "viewAllRecords",
                "modifyAllRecords",
                "viewAllFields"
              ],
              "additionalProperties": false
            },
            "after": {
              "type": "object",
              "properties": {
                "allowCreate": {
                  "type": "boolean"
                },
                "allowRead": {
                  "type": "boolean"
                },
                "allowEdit": {
                  "type": "boolean"
                },
                "allowDelete": {
                  "type": "boolean"
                },
                "viewAllRecords": {
                  "type": "boolean"
                },
                "modifyAllRecords": {
                  "type": "boolean"
                },
                "viewAllFields": {
                  "type": "boolean"
                }
              },
              "required": [
                "allowCreate",
                "allowRead",
                "allowEdit",
                "allowDelete",
                "viewAllRecords",
                "modifyAllRecords",
                "viewAllFields"
              ],
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        }
      }
    }
  },
  "required": [
    "columns",
    "rows",
    "cells"
  ],
  "additionalProperties": false,
  "description": "Matrix of rows x permission holders. cells[row][holder]."
}
```

### permission.fieldAccess

権限セット・プロファイル × 項目の参照・編集の行列。

分類: permission。出力の形: matrix。描ける部品: Matrix

args:

```json
{
  "type": "object",
  "properties": {
    "onlyChanged": {
      "description": "true returns only the changed rows (when comparing with diff / compare).",
      "type": "boolean"
    },
    "rows": {
      "description": "Fields (Object.Field) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "columns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "permissionSet",
              "mutingPermissionSet",
              "profile",
              "permissionSetGroup"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "type",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "cells": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "before": {
              "type": "object",
              "properties": {
                "readable": {
                  "type": "boolean"
                },
                "editable": {
                  "type": "boolean"
                }
              },
              "required": [
                "readable",
                "editable"
              ],
              "additionalProperties": false
            },
            "after": {
              "type": "object",
              "properties": {
                "readable": {
                  "type": "boolean"
                },
                "editable": {
                  "type": "boolean"
                }
              },
              "required": [
                "readable",
                "editable"
              ],
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        }
      }
    }
  },
  "required": [
    "columns",
    "rows",
    "cells"
  ],
  "additionalProperties": false,
  "description": "Matrix of rows x permission holders. cells[row][holder]."
}
```

### permission.apexAccess

権限セット・プロファイルが実行できる Apex クラス・Visualforce ページ。

分類: permission。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "holder": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "permissionSet",
              "mutingPermissionSet",
              "profile",
              "permissionSetGroup"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "type",
          "name"
        ],
        "additionalProperties": false
      },
      "accessType": {
        "type": "string",
        "enum": [
          "apexClass",
          "apexPage"
        ]
      },
      "name": {
        "type": "string"
      },
      "enabled": {
        "type": "boolean"
      }
    },
    "required": [
      "holder",
      "accessType",
      "name",
      "enabled"
    ],
    "additionalProperties": false
  }
}
```

### permission.effective

権限セットグループ (ミュートを含む) が実際に与える権限。

分類: permission。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "group": {
        "type": "string"
      },
      "category": {
        "type": "string",
        "enum": [
          "object",
          "field",
          "apexClass",
          "apexPage",
          "flow",
          "customPermission",
          "userPermission"
        ]
      },
      "target": {
        "type": "string"
      },
      "before": {
        "type": [
          "string",
          "boolean"
        ]
      },
      "after": {
        "description": "Objects: CRED etc. Fields: R / E. Others: true when enabled.",
        "type": [
          "string",
          "boolean"
        ]
      }
    },
    "required": [
      "group",
      "category",
      "target"
    ],
    "additionalProperties": false,
    "description": "Effective permission of a permission set group (including muting)."
  }
}
```

### flow.list

Flow の一覧 (種類・起動条件・対象オブジェクト・状態・要素の数)。

分類: flow。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "processType": {
        "type": "string"
      },
      "triggerType": {
        "type": "string"
      },
      "recordTriggerType": {
        "type": "string"
      },
      "object": {
        "type": "string"
      },
      "flowStatus": {
        "description": "Active / Draft etc.",
        "type": "string"
      },
      "elementCount": {
        "type": "number"
      }
    },
    "required": [
      "name",
      "elementCount"
    ],
    "additionalProperties": false
  }
}
```

### flow.diagram

Flow の要素と接続の図 (差分の status 付き)。

分類: flow。出力の形: diagram。描ける部品: FlowDiagram

args:

```json
{
  "type": "object",
  "properties": {
    "flows": {
      "description": "Flow API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "flow": {
        "type": "string"
      },
      "nodes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "id": {
              "type": "string"
            },
            "kind": {
              "type": "string"
            },
            "label": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "kind"
          ],
          "additionalProperties": false
        }
      },
      "edges": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "from": {
              "type": "string"
            },
            "to": {
              "type": "string"
            },
            "edgeType": {
              "type": "string"
            }
          },
          "required": [
            "from",
            "to",
            "edgeType"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "flow",
      "nodes",
      "edges"
    ],
    "additionalProperties": false
  }
}
```

### flow.diffs

Flow の要素・資源・起動の変更 (変わったプロパティの名前)。

分類: flow。出力の形: rows。描ける部品: DataTable・StatusSummary。**比べる時点が要る** (文書の diff か compare)

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "flow": {
        "type": "string"
      },
      "element": {
        "type": "string",
        "description": "Element or resource name ($start for the start, empty for flow settings)."
      },
      "kind": {
        "type": "string"
      },
      "changedProperties": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Names of changed properties."
      }
    },
    "required": [
      "flow",
      "element",
      "kind",
      "changedProperties"
    ],
    "additionalProperties": false,
    "description": "A changed element, resource or start of a flow."
  }
}
```

### flow.references

Flow が参照する項目・Apex・サブフロー・LWC・ラベル (参照先がなければ problem に指摘)。

分類: flow。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "flow": {
        "type": "string"
      },
      "element": {
        "type": "string"
      },
      "refType": {
        "type": "string"
      },
      "value": {
        "type": "string"
      },
      "problem": {
        "description": "Finding code when the target does not exist.",
        "type": "string"
      }
    },
    "required": [
      "flow",
      "element",
      "refType",
      "value"
    ],
    "additionalProperties": false
  }
}
```

### flow.interface

Flow の入力・出力の変数。前回と比べると、増えた・減った・変わった入出力が分かる (サブフロー・Apex からの呼び出しへの影響)。

分類: flow。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "onlyChanged": {
      "description": "true returns only the changed rows (when comparing with diff / compare).",
      "type": "boolean"
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "flow": {
        "type": "string"
      },
      "variable": {
        "type": "string"
      },
      "direction": {
        "type": "string",
        "enum": [
          "input",
          "output",
          "inputOutput"
        ]
      },
      "dataType": {
        "type": "string"
      },
      "objectType": {
        "type": "string"
      },
      "apexClass": {
        "type": "string"
      },
      "isCollection": {
        "type": "boolean"
      },
      "changedProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "flow",
      "variable",
      "direction",
      "isCollection"
    ],
    "additionalProperties": false,
    "description": "An input or output variable of a flow."
  }
}
```

### apex.outline

Apex のクラス・トリガーのすべてのクラス・メンバー (メソッド・コンストラクタ・プロパティ・項目・内側の型。private とテストも) と、トリガーの対象とイベント。コードの理解・クラスの仕様書のため。外から使えるものだけは apex.interface。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "classes": {
      "description": "Class or trigger names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "includeTests": {
      "description": "false hides test classes (@isTest). Default true.",
      "type": "boolean"
    }
  }
}
```

例:

```json
{
  "classes": [
    "AccountService"
  ]
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "className": {
        "type": "string",
        "description": "Class or trigger name (the unit)."
      },
      "unitType": {
        "type": "string",
        "enum": [
          "class",
          "trigger"
        ]
      },
      "owner": {
        "type": "string",
        "description": "Owner type (Outer, Outer.Inner). The trigger name for triggers."
      },
      "memberType": {
        "type": "string",
        "enum": [
          "class",
          "interface",
          "enum",
          "method",
          "constructor",
          "property",
          "field",
          "trigger"
        ]
      },
      "name": {
        "type": "string"
      },
      "params": {
        "description": "Parameter types (methods, constructors).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "type": {
        "description": "Return type / property and field type / enum values / extended class / trigger object.",
        "type": "string"
      },
      "access": {
        "description": "private when nothing is written. annotated: only exposed by @AuraEnabled etc.",
        "type": "string",
        "enum": [
          "global",
          "public",
          "protected",
          "private",
          "annotated"
        ]
      },
      "static": {
        "type": "boolean"
      },
      "annotations": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "isTest": {
        "description": "Member of a test class (@isTest).",
        "type": "boolean",
        "const": true
      },
      "events": {
        "description": "Trigger events (before insert, after update ...).",
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "className",
      "unitType",
      "owner",
      "memberType",
      "name"
    ],
    "additionalProperties": false,
    "description": "One class, member or trigger (any access, including private and tests)."
  }
}
```

### apex.dataAccess

Apex がどこで (クラス・メソッド) どのオブジェクト・項目を読み書きするか (SOQL・SOSL・動的なクエリ・DML)。ループの中か (ガバナ制限の原因になりやすい)・テストの中かも出す。DML の項目は、同じメソッドで代入している項目。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "classes": {
      "description": "Class, trigger or anonymous Apex names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "objects": {
      "description": "Object API names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "includeTests": {
      "description": "false hides queries and DML in tests. Default true.",
      "type": "boolean"
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "className": {
        "type": "string",
        "description": "Class, trigger or anonymous Apex name (the unit)."
      },
      "unitType": {
        "type": "string",
        "enum": [
          "class",
          "trigger",
          "anonymous"
        ]
      },
      "member": {
        "description": "Method etc. (Class.method). Absent at unit level.",
        "type": "string"
      },
      "operation": {
        "type": "string",
        "enum": [
          "select",
          "search",
          "dynamicQuery",
          "insert",
          "update",
          "upsert",
          "delete",
          "undelete",
          "merge"
        ],
        "description": "select: SOQL / search: SOSL / dynamicQuery: Database.query etc. / DML operations."
      },
      "object": {
        "description": "Target object (absent when it cannot be known).",
        "type": "string"
      },
      "fields": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Fields read by the query (SELECT / WHERE / ORDER BY / GROUP BY), or for DML the fields assigned in the same method on that object."
      },
      "via": {
        "type": "string",
        "enum": [
          "soql",
          "sosl",
          "dynamic",
          "statement",
          "database"
        ],
        "description": "statement: DML statement / database: Database.insert etc."
      },
      "inLoop": {
        "type": "boolean",
        "description": "Inside a loop (a common cause of governor limit errors)."
      },
      "inTest": {
        "type": "boolean",
        "description": "In a test class or test method."
      },
      "accessLevel": {
        "description": "USER_MODE / SYSTEM_MODE etc.",
        "type": "string"
      },
      "allOrNone": {
        "type": "boolean"
      }
    },
    "required": [
      "className",
      "unitType",
      "operation",
      "fields",
      "via",
      "inLoop",
      "inTest"
    ],
    "additionalProperties": false,
    "description": "One SOQL / SOSL query or DML operation: which object and fields the code reads or writes."
  }
}
```

### apex.interface

Apex の外から使えるクラス・メンバー (global・public・@AuraEnabled など)。前回と比べると、公開メソッドの追加・削除・引数や戻り値の型の変化が分かる。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "onlyChanged": {
      "description": "true returns only the changed rows (when comparing with diff / compare).",
      "type": "boolean"
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "className": {
        "type": "string",
        "description": "Outermost class of the unit."
      },
      "owner": {
        "type": "string",
        "description": "Owner type (Outer, Outer.Inner for inner classes)."
      },
      "memberType": {
        "type": "string",
        "enum": [
          "class",
          "interface",
          "enum",
          "method",
          "constructor",
          "property",
          "field"
        ]
      },
      "name": {
        "type": "string"
      },
      "params": {
        "description": "Parameter types.",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "type": {
        "description": "Return type, property type, or enum values.",
        "type": "string"
      },
      "access": {
        "type": "string",
        "enum": [
          "global",
          "public",
          "annotated"
        ]
      },
      "static": {
        "type": "boolean"
      },
      "annotations": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "changedProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "className",
      "owner",
      "memberType",
      "name",
      "access",
      "static",
      "annotations"
    ],
    "additionalProperties": false,
    "description": "A class or member of Apex usable from outside (global, public, @AuraEnabled etc.)."
  }
}
```

### lwc.components

LWC のコンポーネントの一覧 (ラベル・公開先・@api・発行するイベント・使う子コンポーネントと基本コンポーネント・Apex・オブジェクト・突き合わせの指摘の数)。コンポーネント一覧のドキュメントのため。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "components": {
      "description": "Component names (accountList or c/accountList) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "component": {
        "type": "string",
        "description": "namespace/name (c/accountList)."
      },
      "label": {
        "description": "masterLabel of js-meta.xml.",
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "isExposed": {
        "type": "boolean"
      },
      "targets": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Where it can be placed (lightning__RecordPage ...)."
      },
      "apiVersion": {
        "type": "string"
      },
      "language": {
        "type": "string",
        "enum": [
          "js",
          "ts"
        ]
      },
      "apiProperties": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "@api properties (attributes a parent can set)."
      },
      "events": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Events it dispatches."
      },
      "childComponents": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Custom components used in the templates."
      },
      "baseComponents": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Base components (lightning/card ...)."
      },
      "apexMethods": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Apex methods it imports (Class.method)."
      },
      "objects": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Objects it reads or writes (from @salesforce/schema and record forms)."
      },
      "findingCount": {
        "type": "number",
        "description": "Possible mismatches found by the analysis (lwc.detail lists them)."
      }
    },
    "required": [
      "component",
      "targets",
      "apiProperties",
      "events",
      "childComponents",
      "baseComponents",
      "apexMethods",
      "objects",
      "findingCount"
    ],
    "additionalProperties": false,
    "description": "One Lightning web component (bundle)."
  }
}
```

### lwc.detail

LWC のコンポーネントの中身 (親から使える @api・メソッド・イベント・slot、@wire とアダプター、Apex のメソッド、使うコンポーネント、オブジェクトと項目、ラベルなどの import、突き合わせの指摘)。1 行 1 項目。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "components": {
      "description": "Component names (accountList or c/accountList) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "categories": {
      "description": "Categories to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "property",
          "method",
          "event",
          "slot",
          "wire",
          "apex",
          "child",
          "baseComponent",
          "object",
          "field",
          "label",
          "customPermission",
          "resource",
          "messageChannel",
          "finding"
        ]
      }
    }
  }
}
```

例:

```json
{
  "components": [
    "accountList"
  ]
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "changedProperties": {
        "description": "Names of changed properties (only when comparing and the row changed).",
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "component": {
        "type": "string"
      },
      "category": {
        "type": "string",
        "enum": [
          "property",
          "method",
          "event",
          "slot",
          "wire",
          "apex",
          "child",
          "baseComponent",
          "object",
          "field",
          "label",
          "customPermission",
          "resource",
          "messageChannel",
          "finding"
        ],
        "description": "property / method / event / slot: what a parent can use. wire: @wire members. apex: imported Apex methods. child / baseComponent: components used. object / field: data it uses. label / customPermission / resource / messageChannel: other imports. finding: possible mismatch."
      },
      "name": {
        "type": "string"
      },
      "detail": {
        "description": "Type, adapter and parameters, how it is used, or the message of a finding.",
        "type": "string"
      }
    },
    "required": [
      "component",
      "category",
      "name"
    ],
    "additionalProperties": false,
    "description": "One item of a component: its public interface, data, and dependencies."
  }
}
```

### lwc.wireframe

LWC の画面の骨組み (ワイヤーフレーム)。テンプレートから描き、JS は実行しない。分岐 (lwc:if など) はタブ、繰り返し (for:each) は 1 件分、子コンポーネントは展開して入れ子に描く。画面の仕様書のため。

分類: code。出力の形: diagram。描ける部品: LwcWireframe

args:

```json
{
  "type": "object",
  "properties": {
    "components": {
      "description": "Component names (accountList or c/accountList) to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "depth": {
      "description": "How many levels of child components to include for expanding (default 3).",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  }
}
```

例:

```json
{
  "components": [
    "accountList"
  ]
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "roots": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Components to show (namespace/name)."
    },
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "added",
              "removed",
              "changed",
              "unchanged"
            ],
            "description": "Change since the saved state (only when comparing two points)."
          },
          "component": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "templates": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "fileName": {
                  "type": "string"
                },
                "main": {
                  "type": "boolean"
                },
                "nodes": {
                  "type": "array",
                  "items": {
                    "$ref": "#/$defs/__schema0"
                  }
                }
              },
              "required": [
                "fileName",
                "main",
                "nodes"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "component",
          "templates"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "roots",
    "components"
  ],
  "additionalProperties": false,
  "description": "Wireframes of components built from their templates (no JS is run). Includes the local child components used by the roots so they can be expanded.",
  "$defs": {
    "__schema0": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "element",
            "component",
            "text",
            "slot",
            "if",
            "for"
          ],
          "description": "element: HTML / component: c-* or lightning-* / text (expressions as {x}) / slot / if: branches / for: repeated children."
        },
        "tag": {
          "type": "string"
        },
        "module": {
          "description": "c/accountRow, lightning/button ...",
          "type": "string"
        },
        "source": {
          "type": "string",
          "enum": [
            "local",
            "lightning",
            "package"
          ]
        },
        "text": {
          "description": "Text, slot name, or the condition / items expression.",
          "type": "string"
        },
        "attributes": {
          "description": "Attributes as written ({x} for expressions).",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "value": {
                "type": "string"
              }
            },
            "required": [
              "name",
              "value"
            ],
            "additionalProperties": false
          }
        },
        "events": {
          "description": "Event handlers (onclick → click).",
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "branches": {
          "description": "Branches of lwc:if / lwc:elseif / lwc:else (if:true / if:false).",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/__schema0"
                }
              }
            },
            "required": [
              "label",
              "children"
            ],
            "additionalProperties": false
          }
        },
        "items": {
          "description": "Expression of for:each / iterator.",
          "type": "string"
        },
        "children": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/__schema0"
          }
        }
      },
      "required": [
        "type"
      ],
      "additionalProperties": false
    }
  }
}
```

### lwc.interface

LWC の親から使えるもの (@api のプロパティ・メソッド、発行するイベント、slot)。前回と比べると、増えた・減ったものが分かる。

分類: code。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "onlyChanged": {
      "description": "true returns only the changed rows (when comparing with diff / compare).",
      "type": "boolean"
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "component": {
        "type": "string",
        "description": "<namespace>/<bundle>"
      },
      "memberType": {
        "type": "string",
        "enum": [
          "property",
          "method",
          "event",
          "slot"
        ]
      },
      "name": {
        "type": "string"
      },
      "type": {
        "type": "string"
      },
      "params": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "accessor": {
        "type": "string",
        "enum": [
          "field",
          "get",
          "set",
          "get/set"
        ]
      },
      "changedProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "component",
      "memberType",
      "name"
    ],
    "additionalProperties": false,
    "description": "What a parent can use from an LWC: @api property/method, dispatched event, slot."
  }
}
```

### automation.byObject

オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則) と順序。

分類: flow。出力の形: object。描ける部品: AutomationView

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "object": {
        "type": "string"
      },
      "flows": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "name": {
              "type": "string"
            },
            "triggerType": {
              "type": "string"
            },
            "recordTriggerType": {
              "type": "string"
            },
            "triggerOrder": {
              "type": "number"
            }
          },
          "required": [
            "name"
          ],
          "additionalProperties": false
        }
      },
      "triggers": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "name": {
              "type": "string"
            },
            "events": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "triggerStatus": {
              "type": "string"
            }
          },
          "required": [
            "name",
            "events"
          ],
          "additionalProperties": false
        }
      },
      "validationRules": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "name": {
              "type": "string"
            },
            "active": {
              "type": "boolean"
            },
            "errorMessage": {
              "type": "string"
            }
          },
          "required": [
            "name",
            "active"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "object",
      "flows",
      "triggers",
      "validationRules"
    ],
    "additionalProperties": false,
    "description": "Automation of an object: record-triggered flows, Apex triggers, validation rules."
  }
}
```

### layout.detail

ページレイアウトのセクションと項目・関連リスト・アクション (差分付き)。

分類: page。出力の形: object。描ける部品: LayoutView

args:

```json
{
  "type": "object",
  "properties": {
    "layouts": {
      "description": "Layout names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "name": {
        "type": "string"
      },
      "objectApiName": {
        "type": "string"
      },
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "label": {
              "type": "string"
            },
            "columns": {
              "type": "number"
            },
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "added",
                      "removed",
                      "changed",
                      "unchanged"
                    ],
                    "description": "Change since the saved state (only when comparing two points)."
                  },
                  "filePath": {
                    "description": "File of the row (relative to the repository).",
                    "type": "string"
                  },
                  "sourceKeys": {
                    "type": "object",
                    "properties": {
                      "objectKey": {
                        "type": "string"
                      },
                      "sourceKey": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "objectKey",
                      "sourceKey"
                    ],
                    "additionalProperties": false,
                    "description": "Position keys of the source node."
                  },
                  "field": {
                    "type": "string"
                  },
                  "other": {
                    "type": "string"
                  },
                  "behavior": {
                    "type": "string"
                  },
                  "column": {
                    "type": "number"
                  },
                  "row": {
                    "type": "number"
                  },
                  "movedFrom": {
                    "type": "object",
                    "properties": {
                      "section": {
                        "type": "string"
                      },
                      "column": {
                        "type": "number"
                      },
                      "row": {
                        "type": "number"
                      }
                    },
                    "required": [
                      "section",
                      "column",
                      "row"
                    ],
                    "additionalProperties": false
                  }
                },
                "required": [
                  "column",
                  "row"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "label",
            "columns",
            "items"
          ],
          "additionalProperties": false
        }
      },
      "relatedLists": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "relatedList": {
              "type": "string"
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "relatedList",
            "fields"
          ],
          "additionalProperties": false
        }
      },
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "actionName": {
              "type": "string"
            },
            "actionType": {
              "type": "string"
            },
            "sortOrder": {
              "type": "number"
            }
          },
          "required": [
            "actionName"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "name",
      "objectApiName",
      "sections",
      "relatedLists",
      "actions"
    ],
    "additionalProperties": false
  }
}
```

### flexiPage.detail

Lightning ページのリージョンと部品 (LWC・標準の部品) とプロパティ。

分類: page。出力の形: object。描ける部品: FlexiPageView

args:

```json
{
  "type": "object",
  "properties": {
    "flexiPages": {
      "description": "FlexiPage names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "pageType": {
        "type": "string"
      },
      "sobjectType": {
        "type": "string"
      },
      "template": {
        "type": "string"
      },
      "regions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "added",
                "removed",
                "changed",
                "unchanged"
              ],
              "description": "Change since the saved state (only when comparing two points)."
            },
            "filePath": {
              "description": "File of the row (relative to the repository).",
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            },
            "name": {
              "type": "string"
            },
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "added",
                      "removed",
                      "changed",
                      "unchanged"
                    ],
                    "description": "Change since the saved state (only when comparing two points)."
                  },
                  "filePath": {
                    "description": "File of the row (relative to the repository).",
                    "type": "string"
                  },
                  "sourceKeys": {
                    "type": "object",
                    "properties": {
                      "objectKey": {
                        "type": "string"
                      },
                      "sourceKey": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "objectKey",
                      "sourceKey"
                    ],
                    "additionalProperties": false,
                    "description": "Position keys of the source node."
                  },
                  "identifier": {
                    "type": "string"
                  },
                  "itemType": {
                    "type": "string",
                    "enum": [
                      "component",
                      "field"
                    ]
                  },
                  "name": {
                    "type": "string"
                  },
                  "properties": {
                    "type": "object",
                    "propertyNames": {
                      "type": "string"
                    },
                    "additionalProperties": {
                      "type": "string"
                    }
                  },
                  "hasVisibilityRule": {
                    "type": "boolean"
                  },
                  "movedFrom": {
                    "type": "string"
                  }
                },
                "required": [
                  "identifier",
                  "itemType",
                  "name",
                  "properties",
                  "hasVisibilityRule"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "name",
            "items"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "name",
      "regions"
    ],
    "additionalProperties": false
  }
}
```

### lwc.placements

LWC がどの Lightning ページのどのリージョンに置かれているか。

分類: page。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "lwc": {
      "description": "LWC bundle names to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "lwc": {
        "type": "string"
      },
      "flexiPage": {
        "type": "string"
      },
      "pageType": {
        "type": "string"
      },
      "sobjectType": {
        "type": "string"
      },
      "region": {
        "type": "string"
      },
      "properties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "lwc",
      "flexiPage",
      "region",
      "properties"
    ],
    "additionalProperties": false
  }
}
```

### crossRef.labels

カスタム表示ラベルの使われている場所 (Apex・LWC・Flow など) と未使用のラベル。

分類: crossRef。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "name": {
        "type": "string"
      },
      "value": {
        "type": "string"
      },
      "usages": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "origin": {
              "type": "string"
            },
            "unit": {
              "type": "string"
            }
          },
          "required": [
            "origin",
            "unit"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "name",
      "usages"
    ],
    "additionalProperties": false
  }
}
```

### crossRef.references

参照先 (項目・クラス・コンポーネントなど) ごとの、参照している単位 (逆引き)。

分類: crossRef。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "refType": {
        "type": "string"
      },
      "target": {
        "type": "string"
      },
      "usedBy": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "from": {
              "type": "string"
            },
            "via": {
              "type": "string"
            },
            "filePath": {
              "type": "string"
            },
            "sourceKeys": {
              "type": "object",
              "properties": {
                "objectKey": {
                  "type": "string"
                },
                "sourceKey": {
                  "type": "string"
                }
              },
              "required": [
                "objectKey",
                "sourceKey"
              ],
              "additionalProperties": false,
              "description": "Position keys of the source node."
            }
          },
          "required": [
            "from",
            "via",
            "filePath"
          ],
          "additionalProperties": false
        }
      },
      "problem": {
        "type": "string"
      }
    },
    "required": [
      "refType",
      "target",
      "usedBy"
    ],
    "additionalProperties": false
  }
}
```

### metadata.findings

解析の指摘 (権限・ラベル・Flow・画面・参照)。前回と比べると、新しく出た指摘は added、なくなった指摘は removed。

分類: crossRef。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "source": {
        "type": "string",
        "enum": [
          "permission",
          "label",
          "flow",
          "layout",
          "flexiPage",
          "reference"
        ]
      },
      "code": {
        "type": "string"
      },
      "severity": {
        "type": "string",
        "enum": [
          "error",
          "warning",
          "info"
        ]
      },
      "unit": {
        "type": "string",
        "description": "Unit that raised the finding."
      },
      "target": {
        "type": "string"
      },
      "message": {
        "type": "string"
      }
    },
    "required": [
      "source",
      "code",
      "severity",
      "unit",
      "target",
      "message"
    ],
    "additionalProperties": false,
    "description": "A finding of the analysis. Comparing two points: new ones are added, gone ones removed."
  }
}
```

### dependency.dependents

ノードを使っているもの (逆引き。「この項目を使っているもの」)。

分類: dependency。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "target": {
      "type": "string",
      "minLength": 1,
      "description": "Start node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
    },
    "depth": {
      "description": "How many steps to follow (default 1).",
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "level": {
      "description": "Granularity of the returned nodes.",
      "type": "string",
      "enum": [
        "unit",
        "member",
        "site"
      ]
    }
  },
  "required": [
    "target"
  ]
}
```

例:

```json
{
  "target": "field:Invoice__c.Amount__c"
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "id": {
        "type": "string",
        "description": "Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
      },
      "type": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "origin": {
        "type": "string"
      },
      "depth": {
        "description": "Depth at which the node was found.",
        "type": "number"
      }
    },
    "required": [
      "id",
      "type",
      "name",
      "origin"
    ],
    "additionalProperties": false
  }
}
```

### dependency.dependencies

ノードが使っているもの。

分類: dependency。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {
    "target": {
      "type": "string",
      "minLength": 1,
      "description": "Start node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
    },
    "depth": {
      "description": "How many steps to follow (default 1).",
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "level": {
      "description": "Granularity of the returned nodes.",
      "type": "string",
      "enum": [
        "unit",
        "member",
        "site"
      ]
    }
  },
  "required": [
    "target"
  ]
}
```

例:

```json
{
  "target": "apexClass:AccountService"
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "id": {
        "type": "string",
        "description": "Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
      },
      "type": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "origin": {
        "type": "string"
      },
      "depth": {
        "description": "Depth at which the node was found.",
        "type": "number"
      }
    },
    "required": [
      "id",
      "type",
      "name",
      "origin"
    ],
    "additionalProperties": false
  }
}
```

### dependency.impact

前回から変わった単位と、それを使っているため影響を受ける単位。

分類: dependency。出力の形: object。描ける部品: ImpactView。**比べる時点が要る** (文書の diff か compare)

args:

```json
{
  "type": "object",
  "properties": {
    "depth": {
      "description": "How many steps to follow (default 2).",
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    }
  }
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "changed": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "added",
              "removed",
              "changed",
              "unchanged"
            ],
            "description": "Change since the saved state (only when comparing two points)."
          },
          "filePath": {
            "description": "File of the row (relative to the repository).",
            "type": "string"
          },
          "sourceKeys": {
            "type": "object",
            "properties": {
              "objectKey": {
                "type": "string"
              },
              "sourceKey": {
                "type": "string"
              }
            },
            "required": [
              "objectKey",
              "sourceKey"
            ],
            "additionalProperties": false,
            "description": "Position keys of the source node."
          },
          "id": {
            "type": "string",
            "description": "Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
          },
          "type": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "origin": {
            "type": "string"
          },
          "depth": {
            "description": "Depth at which the node was found.",
            "type": "number"
          }
        },
        "required": [
          "id",
          "type",
          "name",
          "origin"
        ],
        "additionalProperties": false
      }
    },
    "impacted": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "added",
              "removed",
              "changed",
              "unchanged"
            ],
            "description": "Change since the saved state (only when comparing two points)."
          },
          "filePath": {
            "description": "File of the row (relative to the repository).",
            "type": "string"
          },
          "sourceKeys": {
            "type": "object",
            "properties": {
              "objectKey": {
                "type": "string"
              },
              "sourceKey": {
                "type": "string"
              }
            },
            "required": [
              "objectKey",
              "sourceKey"
            ],
            "additionalProperties": false,
            "description": "Position keys of the source node."
          },
          "id": {
            "type": "string",
            "description": "Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
          },
          "type": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "origin": {
            "type": "string"
          },
          "depth": {
            "description": "Depth at which the node was found.",
            "type": "number"
          }
        },
        "required": [
          "id",
          "type",
          "name",
          "origin"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "changed",
    "impacted"
  ],
  "additionalProperties": false
}
```

### dependency.missing

リポジトリにない参照先 (存在しない項目・クラス・コンポーネント・ラベルなど)。

分類: dependency。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string"
      },
      "severity": {
        "type": "string",
        "enum": [
          "warning",
          "info"
        ]
      },
      "target": {
        "type": "string"
      },
      "from": {
        "type": "string"
      },
      "unit": {
        "type": "string"
      },
      "message": {
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      }
    },
    "required": [
      "code",
      "severity",
      "target",
      "from",
      "unit",
      "message"
    ],
    "additionalProperties": false
  }
}
```

### dependency.unused

ほかから使われていないもの (掃除の候補)。

分類: dependency。出力の形: rows。描ける部品: DataTable・StatusSummary

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed",
          "changed",
          "unchanged"
        ],
        "description": "Change since the saved state (only when comparing two points)."
      },
      "filePath": {
        "description": "File of the row (relative to the repository).",
        "type": "string"
      },
      "sourceKeys": {
        "type": "object",
        "properties": {
          "objectKey": {
            "type": "string"
          },
          "sourceKey": {
            "type": "string"
          }
        },
        "required": [
          "objectKey",
          "sourceKey"
        ],
        "additionalProperties": false,
        "description": "Position keys of the source node."
      },
      "id": {
        "type": "string",
        "description": "Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.)."
      },
      "type": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "origin": {
        "type": "string"
      },
      "depth": {
        "description": "Depth at which the node was found.",
        "type": "number"
      }
    },
    "required": [
      "id",
      "type",
      "name",
      "origin"
    ],
    "additionalProperties": false
  }
}
```

### dependency.changes

前回と比べた、依存の増減 (メンバーの細かさ)。

分類: dependency。出力の形: rows。描ける部品: DataTable・StatusSummary。**比べる時点が要る** (文書の diff か compare)

args:

```json
{
  "type": "object",
  "properties": {}
}
```

出力:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "from": {
        "type": "string"
      },
      "to": {
        "type": "string"
      },
      "kind": {
        "type": "string"
      },
      "status": {
        "type": "string",
        "enum": [
          "added",
          "removed"
        ]
      }
    },
    "required": [
      "from",
      "to",
      "kind",
      "status"
    ],
    "additionalProperties": false
  }
}
```

### dependency.graph

依存関係の図 (Mermaid か DOT の文字列。単位の細かさ)。

分類: dependency。出力の形: diagram。描ける部品: DiagramText

args:

```json
{
  "type": "object",
  "properties": {
    "targets": {
      "description": "Start node ids to include. Omit for all.",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "depth": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "format": {
      "type": "string",
      "enum": [
        "mermaid",
        "dot"
      ]
    }
  }
}
```

出力:

```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "enum": [
        "mermaid",
        "dot"
      ]
    },
    "text": {
      "type": "string"
    }
  },
  "required": [
    "format",
    "text"
  ],
  "additionalProperties": false
}
```

