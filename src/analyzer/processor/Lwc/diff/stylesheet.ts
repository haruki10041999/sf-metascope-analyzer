import type {
    CssAtRuleJson,
    CssDeclarationJson,
    CssRuleJson,
    CssStatementJson,
    ErrorJson,
    LwcStylesheetJson,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeSequenceDiff,
    makeValueDiff,
    pairByKey,
} from '../../commons/diff/commons';
import { TypedListDiff, makeTypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

// LWC の CSS の差分。方針: docs/lwc-implementation.md
// 木が浅いので GumTree は使わず、メタデータと同じく分類表だけで書く

/** 宣言は prop で対応付ける (D)。同じ規則に同じ prop が複数ある (フォールバック) ときは出現順を足す (color#2) */
export type CssDeclarationsDiff = TypedListDiff<CssDeclarationJson, ValueDiff<CssDeclarationJson>>;

const declarationKeys = (declarations: CssDeclarationJson[]) => {
    const counts = new Map<string, number>();
    return declarations.map((declaration) => {
        const count = (counts.get(declaration.prop) ?? 0) + 1;
        counts.set(declaration.prop, count);
        return count === 1 ? declaration.prop : `${declaration.prop}#${count}`;
    });
};

const makeDeclarationsDiff = (
    before: CssDeclarationJson[],
    after: CssDeclarationJson[],
): CssDeclarationsDiff =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            declarationKeys(before),
            declarationKeys(after),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeValueDiff,
    );

/** 規則の並び。CSS の優先順位に効くので C. 順序付き列 */
export type CssStatementsDiff = ListItemDiff<
    'cssStatement',
    CssStatementJson,
    CssStatementJsonDiff
>[];

export type CssRuleJsonDiff = NodeDiff<
    'cssRule',
    CssRuleJson,
    {
        selector: ValueDiff<string>;
        /** B. 集合 */
        selectors: TypedListDiff<string, never>;
        declarations: CssDeclarationsDiff;
        usesHost: ValueDiff<boolean>;
        rules?: PresentDiff<CssStatementJson[], CssStatementsDiff>;
    }
>;

export type CssAtRuleJsonDiff = NodeDiff<
    'cssAtRule',
    CssAtRuleJson,
    {
        name: ValueDiff<string>;
        params: ValueDiff<string>;
        rules?: PresentDiff<CssStatementJson[], CssStatementsDiff>;
        declarations?: PresentDiff<CssDeclarationJson[], CssDeclarationsDiff>;
    }
>;

export type CssStatementJsonDiff = CssRuleJsonDiff | CssAtRuleJsonDiff;

/**
 * 内容の違う規則同士を、変更 (changed) として対応付けてよいか。
 * 規則はセレクターが 1 つでも共通なもの (.a, .b → .a, .b, .c)、at 規則は名前が同じもの (@media の条件の変更)
 */
const canPairStatements = (before: CssStatementJson, after: CssStatementJson) => {
    if (before.kind === 'cssRule' && after.kind === 'cssRule') {
        return before.selectors.some((selector) => after.selectors.includes(selector));
    }
    return before.kind === 'cssAtRule' && after.kind === 'cssAtRule' && before.name === after.name;
};

const makeStatementsDiff = (
    before: CssStatementJson[],
    after: CssStatementJson[],
    sources?: Sources,
): CssStatementsDiff =>
    makeSequenceDiff(
        'cssStatement',
        before,
        after,
        (b, a, match) => makeStatementDiff(b, a, match, sources),
        { sources, canPair: canPairStatements },
    );

const makeRuleDiff = (
    before: CssRuleJson | ErrorJson,
    after: CssRuleJson | ErrorJson,
    match: Match,
    sources?: Sources,
): CssRuleJsonDiff =>
    makeNodeDiff('cssRule', before, after, match, (b, a) => ({
        selector: makeValueDiff(b.selector, a.selector),
        selectors: makeUnorderedValuesDiff(b.selectors, a.selectors),
        declarations: makeDeclarationsDiff(b.declarations, a.declarations),
        usesHost: makeValueDiff(b.usesHost, a.usesHost),
        ...presentEntry(
            'rules',
            makePresentDiff(b.rules, a.rules, (x, y) => makeStatementsDiff(x, y, sources)),
        ),
    }));

const makeAtRuleDiff = (
    before: CssAtRuleJson | ErrorJson,
    after: CssAtRuleJson | ErrorJson,
    match: Match,
    sources?: Sources,
): CssAtRuleJsonDiff =>
    makeNodeDiff('cssAtRule', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        params: makeValueDiff(b.params, a.params),
        ...presentEntry(
            'rules',
            makePresentDiff(b.rules, a.rules, (x, y) => makeStatementsDiff(x, y, sources)),
        ),
        ...presentEntry(
            'declarations',
            makePresentDiff(b.declarations, a.declarations, makeDeclarationsDiff),
        ),
    }));

/** 対応付くのは同じ kind 同士だけ (canPair) なので、before の kind で分ける */
const makeStatementDiff = (
    before: CssStatementJson,
    after: CssStatementJson,
    match: Match,
    sources?: Sources,
): CssStatementJsonDiff =>
    before.kind === 'cssRule'
        ? makeRuleDiff(before, after as CssRuleJson, match, sources)
        : makeAtRuleDiff(before, after as CssAtRuleJson, match, sources);

export type LwcStylesheetJsonDiff = NodeDiff<
    'lwcStylesheet',
    LwcStylesheetJson,
    {
        scoped: ValueDiff<boolean>;
        /** C. 順序付き列 (読み込む順) */
        imports: TypedListDiff<string, ValueDiff<string>>;
        rules: CssStatementsDiff;
    }
>;

export const makeLwcStylesheetDiff = (
    before: LwcStylesheetJson | ErrorJson,
    after: LwcStylesheetJson | ErrorJson,
    sources?: Sources,
): LwcStylesheetJsonDiff =>
    makeNodeDiff('lwcStylesheet', before, after, 'slot', (b, a) => ({
        scoped: makeValueDiff(b.scoped, a.scoped),
        imports: makeOrderedValuesDiff(b.imports, a.imports),
        rules: makeStatementsDiff(b.rules, a.rules, sources),
    }));
