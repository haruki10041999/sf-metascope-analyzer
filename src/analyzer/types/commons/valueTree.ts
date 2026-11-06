import type { XmlElement } from './xml';

// XML の要素を、要素名をプロパティ名にした値の木にする (種類ごとに形を決めないメタデータ用)。
// - 子のない要素は文字列 ('true' / 'false' は真偽値)。属性 (xmlns を除く) があれば { '#text': 値, '@属性名': 値 }
// - 同じ名前の子が 2 つ以上あるか、lists にある名前なら配列 (1 つしかなくても配列にして、形が変わらないようにする)
// - <value><stringValue>…</stringValue></value> のような値の要素 1 つだけの要素は { type, value }

/** 値の木 */
export type ValueTree =
    | string
    | boolean
    | { type: string; value: string }
    | ValueTree[]
    | { [name: string]: ValueTree };

export type ValueTreeProperties = Record<string, ValueTree>;

export type ValueTreeOptions = {
    /** 1 つしかなくても配列にする要素名 */
    lists?: ReadonlySet<string>;
    /** 読まない要素 (どの深さでも)。要素名の一覧か、要素名で決める関数 (Flow の接続・位置など) */
    skip?: ReadonlySet<string> | ((name: string) => boolean);
    /** 値の要素の名前 (既定は VALUE_TYPES。Flow は apexValue なども足す) */
    valueTypes?: ReadonlySet<string>;
};

const isSkipped = (options: ValueTreeOptions, name: string): boolean =>
    typeof options.skip === 'function' ? options.skip(name) : (options.skip?.has(name) ?? false);

/** 値の要素 (<value><stringValue>…</stringValue></value> の stringValue など) */
export const VALUE_TYPES: ReadonlySet<string> = new Set([
    'booleanValue',
    'dateTimeValue',
    'dateValue',
    'elementReference',
    'numberValue',
    'stringValue',
]);

const scalar = (text: string): string | boolean =>
    text === 'true' ? true : text === 'false' ? false : text;

const attributesOf = (element: XmlElement) =>
    Object.entries(element.attributes).filter(
        ([name]) => name !== 'xmlns' && !name.startsWith('xmlns:'),
    );

/** 要素 1 つを値にする */
export const toValueTree = (element: XmlElement, options: ValueTreeOptions = {}): ValueTree => {
    const attributes = attributesOf(element);
    if (element.children.length === 0) {
        if (!attributes.length) return scalar(element.text);
        return {
            '#text': element.text,
            ...Object.fromEntries(attributes.map(([name, value]) => [`@${name}`, value])),
        };
    }
    const [only] = element.children;
    if (
        element.children.length === 1 &&
        (options.valueTypes ?? VALUE_TYPES).has(only!.name) &&
        only!.children.length === 0 &&
        !attributes.length
    ) {
        return { type: only!.name, value: only!.text };
    }
    return {
        ...Object.fromEntries(attributes.map(([name, value]) => [`@${name}`, value])),
        ...toValueTreeProperties(element, options),
    };
};

/** 子要素を値の木にする。exclude の子は持たない */
export const toValueTreeProperties = (
    element: XmlElement,
    options: ValueTreeOptions = {},
    exclude: ReadonlySet<string> = new Set(),
): ValueTreeProperties => {
    const groups = new Map<string, XmlElement[]>();
    for (const child of element.children) {
        if (exclude.has(child.name) || isSkipped(options, child.name)) continue;
        groups.set(child.name, [...(groups.get(child.name) ?? []), child]);
    }
    return Object.fromEntries(
        [...groups].map(([name, items]) => [
            name,
            items.length > 1 || options.lists?.has(name)
                ? items.map((item) => toValueTree(item, options))
                : toValueTree(items[0]!, options),
        ]),
    );
};
