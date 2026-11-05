import type { AtRule, ChildNode, Declaration, Root, Rule } from 'postcss';

import type { JsonType } from '../commons/json';
import { makePositionOf } from '../commons/source';
import {
    makeSpanJson,
    type SourceFile,
    type Span,
    type SpanSourceRegistry,
} from '../commons/spanJson';

// LWC の CSS (.css) の JSON。中間表現は作らず、postcss の木から直接作る (XML と同じ方式)。
// 方針: docs/lwc-template-stylesheet-plan.md 5 章

/**
 * 宣言 1 つ。規則の中で prop で決まる値なので kind を持たない (メタデータの値と同じ扱い)。
 * 空白の書き方 (raws) は持たない
 */
export type CssDeclarationJson = {
    prop: string;
    /** 値 (連続する空白は 1 つにする。!important は含まない) */
    value: string;
    important: boolean;
    /** 値の中で使っているカスタムプロパティ (var(--名前) の名前)。なければ持たない */
    uses?: string[];
    /** カスタムプロパティの定義 (--名前: 値) なら、その名前 */
    defines?: string;
};

/** 規則 (セレクター { 宣言 })。入れ子の規則 (CSS Nesting) は rules に持つ */
export type CssRuleJson = JsonType<'cssRule'> & {
    /** selectors をカンマでつないだもの (空白の書き方に依らない) */
    selector: string;
    /** カンマで分けたセレクター (前後の空白を除き、連続する空白は 1 つにする) */
    selectors: string[];
    declarations: CssDeclarationJson[];
    /** :host を含むか */
    usesHost: boolean;
    rules?: CssStatementJson[];
};

/** at 規則 (@media / @supports / @keyframes / @font-face など)。@import は LwcStylesheetJson の imports に入れる */
export type CssAtRuleJson = JsonType<'cssAtRule'> & {
    name: string;
    params: string;
    /** 中の規則 (@media など)。ないものは持たない */
    rules?: CssStatementJson[];
    /** 中の宣言 (@font-face など)。ないものは持たない */
    declarations?: CssDeclarationJson[];
};

export type CssStatementJson = CssRuleJson | CssAtRuleJson;

export type LwcStylesheetJson = JsonType<'lwcStylesheet'> & {
    /** *.scoped.css (Light DOM のスコープ付きスタイル) */
    scoped: boolean;
    /** @import の読み込み先 ('c/shared')。読み込む順 */
    imports: string[];
    rules: CssStatementJson[];
};

const normalizeSpace = (text: string) => text.replace(/\s+/g, ' ').trim();

const VAR_PATTERN = /var\(\s*(--[\w-]+)/g;

/** @import の params ('c/shared' / "c/shared" / url(...)) から読み込み先を取り出す */
const importTarget = (params: string) => {
    const quoted = params.match(/^\s*(?:url\(\s*)?(['"])(.*?)\1/);
    return quoted ? quoted[2]! : normalizeSpace(params);
};

/** postcss の木 → LwcStylesheetJson */
export const makeLwcStylesheetJson = (
    root: Root,
    scoped: boolean,
    file: SourceFile,
    registry: SpanSourceRegistry,
): LwcStylesheetJson => {
    const positionOf = makePositionOf(file.source);
    // postcss の end.offset は最後の文字の位置 (含む) なので、次の位置にする
    const spanOf = (node: ChildNode | Root): Span | undefined => {
        const start = node.source?.start?.offset;
        const end = node.source?.end?.offset;
        if (start === undefined) return undefined;
        return { start: positionOf(start), end: positionOf(end === undefined ? start : end + 1) };
    };

    const makeDeclaration = (decl: Declaration): CssDeclarationJson => {
        const value = normalizeSpace(decl.value);
        const uses = [...new Set([...value.matchAll(VAR_PATTERN)].map((m) => m[1]!))];
        return {
            prop: decl.prop,
            value,
            important: decl.important === true,
            ...(uses.length ? { uses } : {}),
            ...(decl.prop.startsWith('--') ? { defines: decl.prop } : {}),
        };
    };

    const declarationsOf = (nodes: ChildNode[]) =>
        nodes.filter((n): n is Declaration => n.type === 'decl').map(makeDeclaration);

    const statementsOf = (nodes: ChildNode[]): CssStatementJson[] =>
        nodes.flatMap((node): CssStatementJson[] => {
            if (node.type === 'rule') return [makeRule(node)];
            if (node.type === 'atrule' && node.name.toLowerCase() !== 'import') {
                return [makeAtRule(node)];
            }
            return [];
        });

    const makeRule = (rule: Rule): CssRuleJson => {
        const selectors = rule.selectors.map(normalizeSpace);
        const rules = statementsOf(rule.nodes);
        return makeSpanJson<CssRuleJson>(
            'cssRule',
            {
                selector: selectors.join(', '),
                selectors,
                declarations: declarationsOf(rule.nodes),
                usesHost: selectors.some((selector) => selector.includes(':host')),
                ...(rules.length ? { rules } : {}),
            },
            spanOf(rule),
            file,
            registry,
        );
    };

    const makeAtRule = (atRule: AtRule): CssAtRuleJson => {
        const nodes = atRule.nodes ?? [];
        const rules = statementsOf(nodes);
        const declarations = declarationsOf(nodes);
        return makeSpanJson<CssAtRuleJson>(
            'cssAtRule',
            {
                name: atRule.name.toLowerCase(),
                params: normalizeSpace(atRule.params),
                ...(rules.length ? { rules } : {}),
                ...(declarations.length ? { declarations } : {}),
            },
            spanOf(atRule),
            file,
            registry,
        );
    };

    const imports = root.nodes
        .filter((n): n is AtRule => n.type === 'atrule' && n.name.toLowerCase() === 'import')
        .map((n) => importTarget(n.params));

    // ルートはファイル全体のソースを持たない (JS のモジュールと同じ。中身は各規則が持つ)。位置はファイルの先頭の空の範囲
    return makeSpanJson<LwcStylesheetJson>(
        'lwcStylesheet',
        { scoped, imports, rules: statementsOf(root.nodes) },
        undefined,
        file,
        registry,
    );
};
