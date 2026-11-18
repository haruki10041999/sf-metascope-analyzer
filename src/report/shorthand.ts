import type { z } from 'zod';

import { REPORT_COMPONENTS, REPORT_DATA_BINDINGS, type ReportComponentName } from './catalog';

// 文書の省略と短い書き方 (docs/todo.md 3.2)。文書を確かめる前に、今の形 (平らな elements・すべての props) に直す。
// - props の省いたキーは、その部品が null を受け取れるなら null で埋める (使わないものは書かなくてよい)。props そのものも省ける
// - children を省けば []
// - 入れ子で書ける: spec.root と children に、キーの代わりに要素そのものを書ける (key を書けばそのキー、なければ親のキーと位置から作る)
// - データの部品のデータ (rows・data) に "@<名前>" と書けば { "$state": "/data/<名前>" }
// - データをすべて要素に書けば、上の段の data を省ける
// 今の形 (すべて書いた文書) はそのまま通る

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const DATA_REFERENCE = /^@([A-Za-z][A-Za-z0-9_]*)$/;

/** 部品の props のキーと、null を受け取れるか */
export const nullableKeysOf = (type: unknown): string[] => {
    const definition = (REPORT_COMPONENTS as Record<string, { props?: unknown }>)[String(type)];
    const shape = (definition?.props as { shape?: Record<string, z.ZodType> } | undefined)?.shape;
    if (!shape) return [];
    return Object.entries(shape)
        .filter(([, schema]) => schema.safeParse(null).success)
        .map(([key]) => key);
};

/** 要素 1 つを今の形にする (props を埋め、データの短い指し方を直し、children を [] にする) */
const completeElement = (element: Json): Json => {
    const props: Json = isObject(element.props) ? { ...element.props } : {};
    for (const key of nullableKeysOf(element.type)) {
        if (!(key in props)) props[key] = null;
    }
    const binding = REPORT_DATA_BINDINGS[element.type as ReportComponentName];
    const value = binding ? props[binding.prop] : undefined;
    const match = typeof value === 'string' ? value.match(DATA_REFERENCE) : null;
    if (binding && match) props[binding.prop] = { $state: `/data/${match[1]}` };
    return { ...element, props, children: Array.isArray(element.children) ? element.children : [] };
};

/** 省略と短い書き方を、今の形に直す。文書の形でなければそのまま返す (検証で問題になる) */
export const expandShorthand = (document: unknown): unknown => {
    if (!isObject(document) || !isObject(document.spec)) return document;
    const spec = document.spec;
    const elements: Json = isObject(spec.elements) ? { ...spec.elements } : {};
    const used = new Set(Object.keys(elements));
    const keyOf = (preferred: string) => {
        let key = preferred;
        for (let i = 2; used.has(key); i++) key = `${preferred}_${i}`;
        used.add(key);
        return key;
    };
    /** 要素 (入れ子の子を含む) を elements に置き、そのキーを返す */
    const place = (element: Json, key: string): string => {
        const { key: _written, children, ...rest } = element;
        const childKeys = Array.isArray(children)
            ? children.map((child, index) =>
                  isObject(child)
                      ? place(
                            child,
                            keyOf(typeof child.key === 'string' ? child.key : `${key}_${index}`),
                        )
                      : child,
              )
            : children;
        elements[key] = completeElement({
            ...rest,
            ...(childKeys !== undefined ? { children: childKeys } : {}),
        });
        return key;
    };
    for (const [key, element] of Object.entries(elements)) {
        if (isObject(element)) place(element, key);
    }
    const root = isObject(spec.root)
        ? place(spec.root, keyOf(typeof spec.root.key === 'string' ? spec.root.key : 'root'))
        : spec.root;
    return {
        ...document,
        // データをすべて要素に書いた文書は、上の段の data を省ける
        data: isObject(document.data) ? document.data : {},
        spec: { ...spec, root, elements },
    };
};
