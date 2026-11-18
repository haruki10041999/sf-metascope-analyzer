import { z } from 'zod';

import { ReportDocument } from './document';
import { buildReportCatalog } from './llmCatalog';
import { nullableKeysOf } from './shorthand';

// エディターで補完・検証するための、文書の JSON Schema (docs/todo.md 3.2)。
// 文書に "$schema": "<このファイル>" を書けば、VS Code などで部品の名前・props・provider の名前・引数が補完される。
// 文書の定義 (document.ts の zod) から作った形に、次を足す:
// - 要素の type は部品の名前。type ごとに props を部品のスキーマで確かめる (if / then)
// - データの宣言の provider は provider の名前。provider ごとに args を引数のスキーマで確かめる
// - props・args の値には、{ "$state" }・{ "$note" }・${...} を含む文字列 (for の行・文書の引数) も書ける
// - データの部品の rows・data は書かなくてよい (要素の data に書けば、ビルドがつなぐ)
// - 省略と短い書き方 (report/shorthand.ts): null を受け取れる props・children・data は省ける。spec.root と children に要素を入れ子で書ける

type JsonSchema = Record<string, unknown>;

/** 文書の JSON Schema の名前 (docs/catalog/ に書くファイル) */
export const DOCUMENT_SCHEMA_FILE = 'report-document.schema.json';

const isObject = (value: unknown): value is JsonSchema =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** 木のすべてのオブジェクトをたどる */
const walk = (value: unknown, visit: (node: JsonSchema) => void) => {
    if (Array.isArray(value)) {
        for (const item of value) walk(item, visit);
    } else if (isObject(value)) {
        visit(value);
        for (const child of Object.values(value)) walk(child, visit);
    }
};

/** 部分のスキーマの $defs を、全体の $defs に移す (名前に prefix を付け、$ref を付け直す) */
const embed = (schema: JsonSchema, prefix: string, defs: Record<string, unknown>): JsonSchema => {
    const copy = structuredClone(schema);
    delete copy.$schema;
    const own = isObject(copy.$defs) ? copy.$defs : undefined;
    delete copy.$defs;
    if (!own) return copy;
    const rename = (node: JsonSchema) => {
        if (typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) {
            node.$ref = `#/$defs/${prefix}_${node.$ref.slice('#/$defs/'.length)}`;
        }
    };
    walk(copy, rename);
    for (const [name, def] of Object.entries(own)) {
        walk(def, rename);
        defs[`${prefix}_${name}`] = def;
    }
    return copy;
};

/** 値に、${...} を含む文字列・{ "$state" }・{ "$note" } も書けるようにする */
const relax = (schema: JsonSchema, optional: string[] = []): JsonSchema => {
    if (!isObject(schema.properties)) return schema;
    const properties: Record<string, unknown> = {};
    for (const [name, property] of Object.entries(schema.properties)) {
        const description = isObject(property) ? property.description : undefined;
        properties[name] = {
            ...(description ? { description } : {}),
            anyOf: [property, { $ref: '#/$defs/dynamicValue' }],
        };
    }
    const required = Array.isArray(schema.required)
        ? schema.required.filter((name) => !optional.includes(name as string))
        : undefined;
    return { ...schema, properties, ...(required ? { required } : {}) };
};

const DYNAMIC_VALUE: JsonSchema = {
    description:
        'A value decided by the build: a string with ${m.x} / ${params.x}, "@<name>" (data), { "$state": "/data/<name>" } or { "$note": "<key>" }.',
    anyOf: [
        { type: 'string', pattern: '\\$\\{' },
        { type: 'string', pattern: '^@[A-Za-z][A-Za-z0-9_]*$' },
        {
            type: 'object',
            properties: { $state: { type: 'string' } },
            required: ['$state'],
            additionalProperties: false,
        },
        {
            type: 'object',
            properties: { $note: { type: 'string' } },
            required: ['$note'],
            additionalProperties: false,
        },
    ],
};

/** 文書の JSON Schema を作る */
export const buildDocumentJsonSchema = (): JsonSchema => {
    const catalog = buildReportCatalog();
    const base = z.toJSONSchema(ReportDocument, {
        io: 'input',
        unrepresentable: 'any',
    }) as JsonSchema;
    const defs: Record<string, unknown> = { ...(isObject(base.$defs) ? base.$defs : {}) };
    defs.dynamicValue = DYNAMIC_VALUE;

    // provider ごとの args (データの宣言はいくつかの場所にあるので、provider と args を持つ形をすべて直す)
    const providerArgs = catalog.providers.map((provider) => ({
        if: { properties: { provider: { const: provider.name } }, required: ['provider'] },
        then: {
            properties: {
                args: relax(
                    embed(provider.args, `args_${provider.name.replace(/\W/g, '_')}`, defs),
                ),
            },
        },
    }));
    const providerNames = catalog.providers.map((provider) => provider.name);
    const patchDataSource = (node: JsonSchema) => {
        const properties = node.properties;
        if (!isObject(properties) || !isObject(properties.provider) || !('args' in properties))
            return;
        properties.provider = {
            ...properties.provider,
            enum: providerNames,
        };
        node.allOf = providerArgs;
    };
    walk(base, patchDataSource);
    for (const def of Object.values(defs)) walk(def, patchDataSource);

    // 要素の type ごとの props。要素は $defs に移し、spec.root・children に入れ子で書けるようにする (report/shorthand.ts)
    const spec = (base.properties as Record<string, JsonSchema>).spec!;
    const specProperties = spec.properties as Record<string, JsonSchema>;
    const elements = specProperties.elements!;
    const element = elements.additionalProperties as JsonSchema;
    defs.element = element;
    elements.additionalProperties = { $ref: '#/$defs/element' };
    const elementRef = { $ref: '#/$defs/element' };
    specProperties.root = {
        description: 'Key of the root element, or the root element itself (nested form).',
        anyOf: [{ type: 'string' }, elementRef],
    };
    spec.required = ['root'];
    const elementProperties = element.properties as Record<string, JsonSchema>;
    elementProperties.key = {
        type: 'string',
        description: 'Key of a nested element (default: <parent key>_<position>).',
    };
    elementProperties.children = {
        type: 'array',
        description:
            'Child elements: keys, or the elements themselves (nested form). Can be omitted.',
        items: { anyOf: [{ type: 'string' }, elementRef] },
    };
    // props・children は省ける (props の省いたキーは null で埋める)
    element.required = ['type'];
    elementProperties.type = {
        ...elementProperties.type,
        enum: catalog.components.map((component) => component.name),
        description: 'Component name (list_report_components).',
    };
    element.allOf = catalog.components.map((component) => ({
        if: { properties: { type: { const: component.name } }, required: ['type'] },
        then: {
            properties: {
                props: relax(embed(component.props, `props_${component.name}`, defs), [
                    ...component.dataProps,
                    ...nullableKeysOf(component.name),
                ]),
            },
        },
    }));

    const properties = base.properties as Record<string, unknown>;
    // データをすべて要素に書けば、上の段の data は省ける
    base.required = (base.required as string[]).filter((name) => name !== 'data');
    return {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: 'sf-metascope report document',
        description:
            'A report document: the structure of a report (components, their order, and the kinds of data to show). It does not name individual classes or objects; use for / where to take them from data rows. Build it with sf-metascope report build or the MCP tool build_report.',
        ...base,
        properties: {
            $schema: {
                type: 'string',
                description: 'Path or URL of this JSON Schema (for editors).',
            },
            ...properties,
        },
        $defs: defs,
    };
};
