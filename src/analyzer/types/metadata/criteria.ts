import { JsonType } from '../commons/json';
import { makePositionOf } from '../commons/source';
import { SourceFile, SpanSourceRegistry, makeSpanJson } from '../commons/spanJson';
import { XmlElement, childOf, childrenOf, decodeRange, textOffsetsOf } from '../commons/xml';
import { type ValueTreeOptions, toValueTreeProperties } from '../commons/valueTree';
import {
    type FormulaValue,
    type TemplateValue,
    formulaTextOf,
    makeFormulaJson,
    makeTemplateJson,
} from './formula';

// 条件の行の共通の形と booleanFilter の木 (docs/json-redesign-plan.md の段階 M5、docs/metadata-json-review.md 5.2)。
// リストビューの filters・参照の絞り込みの filterItems・FlexiPage の表示条件・ワークフロー / 共有ルールの criteriaItems は、
// 要素名は違うが同じ考え (項目・演算子・値) なので、同じ criterion にする。booleanFilter は木だけを持つ (決めたこと 8)

/** 条件の右辺 */
export type CriterionValueJson = JsonType<'criterionValue'> & CriterionValueBody;

/** 条件の右辺の中身 (metadata 8 から右辺はノード。位置は右辺の要素のもの) */
type CriterionValueBody =
    /**
     * 書いた値 (リストビューの value・FlexiPage の rightValue など。カンマ区切りの値もそのまま)。
     * Flow の値の要素は valueType に要素名 (stringValue・numberValue など) を持つ
     */
    | { type: 'value'; value: string; valueType?: string }
    /** Flow の資源・要素の参照 (elementReference。段階 M7) */
    | { type: 'reference'; value: FormulaValue }
    /** 別の項目 (valueField。$Source.X など) */
    | { type: 'field'; value: FormulaValue }
    /** 差し込み ({!...}) を含む値 */
    | { type: 'formula'; value: FormulaValue };

/** 条件の行 1 つ */
export type CriterionJson = JsonType<'criterion'> & {
    /** 左辺の項目 (Account.Name・$Source.Status__c・{!Record.Status__c})。数式の JSON (読めなければ文字列) */
    left: FormulaValue;
    /** 演算子 (XML のまま。equals・EQUAL など種類で書き方が違う) */
    operator?: string;
    right?: CriterionValueJson;
};

/** 条件の行の要素名 (種類ごとに違う) */
export type CriterionNames = {
    left: string;
    operator: string;
    value: string;
    /** 右辺が別の項目のときの要素名 */
    valueField?: string;
};

/** ワークフロー・共有ルール・参照の絞り込みの条件の行 (criteriaItems / filterItems) */
export const CRITERIA_ITEM_NAMES: CriterionNames = {
    left: 'field',
    operator: 'operation',
    value: 'value',
    valueField: 'valueField',
};

/** booleanFilter の式の木 (構文解析の結果)。row は条件の行の番号 (1 始まり。書いた順) */
export type FilterLogicTree =
    | { type: 'and' | 'or'; operands: FilterLogicTree[] }
    | { type: 'not'; operand: FilterLogicTree }
    | { type: 'row'; index: number };

/**
 * JSON に入れる booleanFilter の木 (metadata 8 から各段がノード)。文字列から作るので段ごとの位置はなく、
 * どの段も booleanFilter の要素の位置を使う (objectKey は段の中身から作る)
 */
export type FilterLogicJson = JsonType<'filterLogic'> &
    (
        | { type: 'and' | 'or'; operands: FilterLogicJson[] }
        | { type: 'not'; operand: FilterLogicJson }
        | { type: 'row'; index: number }
    );

/** booleanFilter の値。読めなければ文字列のまま */
export type FilterLogicValue = FilterLogicJson | string;

export class FilterLogicSyntaxError extends Error {
    readonly offset: number;

    constructor(message: string, offset: number) {
        super(message);
        this.name = 'FilterLogicSyntaxError';
        this.offset = offset;
    }
}

/** booleanFilter (1 AND (2 OR NOT 3)) を木にする。AND は OR より強い。同じ演算子の並びは 1 つにまとめる */
export const parseFilterLogic = (text: string): FilterLogicTree => {
    const tokens: { value: string; start: number }[] = [];
    const pattern = /\s*(\d+|[A-Za-z]+|\(|\)|\S)/gy;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
        tokens.push({ value: match[1]!, start: match.index + match[0].length - match[1]!.length });
    }
    let index = 0;
    const peek = () => tokens[index]?.value.toUpperCase();
    const fail = (message: string): never => {
        throw new FilterLogicSyntaxError(message, tokens[index]?.start ?? text.length);
    };
    const chain = (type: 'and' | 'or', operand: () => FilterLogicTree): FilterLogicTree => {
        const operands = [operand()];
        while (peek() === type.toUpperCase()) {
            index++;
            operands.push(operand());
        }
        return operands.length === 1 ? operands[0]! : { type, operands };
    };
    const or = (): FilterLogicTree => chain('or', and);
    const and = (): FilterLogicTree => chain('and', not);
    const not = (): FilterLogicTree => {
        if (peek() === 'NOT') {
            index++;
            return { type: 'not', operand: not() };
        }
        return primary();
    };
    const primary = (): FilterLogicTree => {
        const token = tokens[index];
        if (!token) return fail('condition expected');
        if (/^\d+$/.test(token.value)) {
            index++;
            return { type: 'row', index: Number(token.value) };
        }
        if (token.value === '(') {
            index++;
            const inner = or();
            if (peek() !== ')') fail('`)` expected');
            index++;
            return inner;
        }
        return fail(`unexpected \`${token.value}\``);
    };
    const root = or();
    if (index < tokens.length) fail(`unexpected \`${tokens[index]!.value}\``);
    return root;
};

/** booleanFilter の木を文字列に戻す (表示用) */
export const filterLogicTextOf = (
    value: FilterLogicValue | FilterLogicTree,
    nested = false,
): string => {
    if (typeof value === 'string') return value;
    switch (value.type) {
        case 'row':
            return String(value.index);
        case 'not':
            return `NOT ${filterLogicTextOf(value.operand, true)}`;
        default: {
            const text = value.operands
                .map((operand) => filterLogicTextOf(operand, true))
                .join(` ${value.type.toUpperCase()} `);
            return nested ? `(${text})` : text;
        }
    }
};

/** 数式・条件を読むときの、読み込み中のファイルと登録先 */
type ReadContext = { file: SourceFile; registry: SpanSourceRegistry };

/** 読めなかったものを registry.problems に足す */
const addProblem = (
    { file, registry }: ReadContext,
    element: XmlElement,
    code: 'FORMULA_SYNTAX' | 'FILTER_LOGIC_SYNTAX',
    message: string,
    offset: number,
) => {
    const source = element.file ?? file;
    registry.problems.push({
        code,
        file: source,
        kindType: element.name,
        message,
        position: makePositionOf(source.source)(offset),
    });
};

/** 要素のテキストを数式の JSON にする。読めなければ文字列のまま持ち、registry.problems に理由を足す */
export const readFormula = (element: XmlElement, context: ReadContext): FormulaValue =>
    makeFormulaJson(element, context.file, context.registry, ({ message, offset }) =>
        addProblem(context, element, 'FORMULA_SYNTAX', message, offset),
    );

/** booleanFilter の要素を木にする。読めなければ文字列のまま持ち、registry.problems に理由を足す */
export const readFilterLogic = (element: XmlElement, context: ReadContext): FilterLogicValue => {
    try {
        const toNode = (tree: FilterLogicTree): FilterLogicJson =>
            makeSpanJson<FilterLogicJson>(
                'filterLogic',
                (tree.type === 'row'
                    ? tree
                    : tree.type === 'not'
                      ? { type: 'not', operand: toNode(tree.operand) }
                      : { type: tree.type, operands: tree.operands.map(toNode) }) as Omit<
                    FilterLogicJson,
                    'kind' | 'sourceKeys'
                >,
                element,
                element.file ?? context.file,
                context.registry,
            );
        return toNode(parseFilterLogic(element.text));
    } catch (error) {
        if (!(error instanceof FilterLogicSyntaxError)) throw error;
        // 位置は要素の中身の先頭からのずれで近似する (booleanFilter に実体参照は出ない)
        const start = element.content
            ? element.content.start +
              (element.file ?? context.file).source
                  .slice(element.content.start, element.content.end)
                  .search(/\S|$/)
            : element.start.offset;
        addProblem(context, element, 'FILTER_LOGIC_SYNTAX', error.message, start + error.offset);
        return element.text;
    }
};

/** 条件の右辺のノード (位置は右辺の要素) */
const criterionValueOf = (
    body: CriterionValueBody,
    element: XmlElement,
    context: ReadContext,
): CriterionValueJson =>
    makeSpanJson<CriterionValueJson>(
        'criterionValue',
        body as Omit<CriterionValueJson, 'kind' | 'sourceKeys'>,
        element,
        element.file ?? context.file,
        context.registry,
    );

/** 条件の行 1 つ */
export const makeCriterionJson = (
    element: XmlElement,
    names: CriterionNames,
    context: ReadContext,
): CriterionJson => {
    const left = childOf(element, names.left);
    const operator = childOf(element, names.operator)?.text;
    const value = childOf(element, names.value);
    const valueField = names.valueField ? childOf(element, names.valueField) : undefined;
    const right: CriterionValueJson | undefined = valueField
        ? criterionValueOf(
              { type: 'field', value: readFormula(valueField, context) },
              valueField,
              context,
          )
        : value
          ? criterionValueOf(
                value.text.includes('{!')
                    ? { type: 'formula', value: readFormula(value, context) }
                    : { type: 'value', value: value.text },
                value,
                context,
            )
          : undefined;
    return makeSpanJson<CriterionJson>(
        'criterion',
        {
            left: left ? readFormula(left, context) : '',
            ...(operator !== undefined ? { operator } : {}),
            ...(right ? { right } : {}),
        },
        element,
        element.file ?? context.file,
        context.registry,
    );
};

/** 子要素 name の条件の行 (書いた順。booleanFilter の番号はこの順) */
export const readCriteria = (
    element: XmlElement,
    name: string,
    names: CriterionNames,
    context: ReadContext,
): CriterionJson[] =>
    childrenOf(element, name).map((item) => makeCriterionJson(item, names, context));

/** 条件の左辺・右辺を文字列にする (表示・{!Record.X} の確かめ用)。右辺がなければ空文字 */
export const criterionTextsOf = (criterion: CriterionJson): { left: string; right: string } => ({
    left: formulaTextOf(criterion.left),
    right: !criterion.right
        ? ''
        : criterion.right.type === 'value'
          ? criterion.right.value
          : formulaTextOf(criterion.right.value),
});

/** 数式の値が名前 1 つ (Account.Name・$Source.X) なら . でつないだ名前。読めなかった文字列はそのまま */
export const formulaNameOf = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value || undefined;
    if (typeof value === 'object' && value !== null) {
        const node = value as { kind?: unknown; path?: unknown };
        if (node.kind === 'fxName' && Array.isArray(node.path)) return node.path.join('.');
    }
    return undefined;
};

/** 条件の行の項目 (左辺と、右辺が別の項目のときはその項目) の名前 */
export const criterionFieldsOf = (criterion: unknown): string[] => {
    if (typeof criterion !== 'object' || criterion === null) return [];
    const { left, right } = criterion as {
        left?: unknown;
        right?: { type?: unknown; value?: unknown };
    };
    return [
        formulaNameOf(left),
        right?.type === 'field' ? formulaNameOf(right.value) : undefined,
    ].filter((name): name is string => name !== undefined);
};

/** 要素のテキスト (差し込みを含む文字列) をテンプレートの JSON にする。読めない差し込みは registry.problems に足す */
export const readTemplate = (element: XmlElement, context: ReadContext): TemplateValue => {
    const source = element.file ?? context.file;
    const offsets = textOffsetsOf(element, source.source);
    return makeTemplateJson(
        offsets ? { text: element.text, ...offsets } : { text: element.text },
        source,
        context.registry,
        { start: element.start, end: element.end },
        ({ message, offset }) => addProblem(context, element, 'FORMULA_SYNTAX', message, offset),
    );
};

/** 属性の値をテンプレートの JSON にする (段階 M6。差し込みがなければ文字列のまま) */
export const readAttributeTemplate = (
    element: XmlElement,
    name: string,
    context: ReadContext,
): TemplateValue => {
    const source = element.file ?? context.file;
    const span = element.attributeSpans?.[name];
    const decoded = span
        ? decodeRange(source.source, span.start, span.end)
        : { text: element.attributes[name] ?? '' };
    return makeTemplateJson(
        decoded,
        source,
        context.registry,
        { start: element.start, end: element.end },
        ({ message, offset }) => addProblem(context, element, 'FORMULA_SYNTAX', message, offset),
    );
};

// ---------------------------------------------------------------------------
// 値の木の中の条件の行・数式・テンプレート (段階 M7)
// ---------------------------------------------------------------------------

/** Flow の値の要素 (<rightValue><stringValue>…</stringValue></rightValue> など) を条件の右辺にする */
const flowValueOf = (element: XmlElement, context: ReadContext): CriterionValueJson | undefined => {
    const [only] = element.children;
    if (!only || element.children.length !== 1) {
        return element.text
            ? criterionValueOf({ type: 'value', value: element.text }, element, context)
            : undefined;
    }
    switch (only.name) {
        case 'elementReference':
            return criterionValueOf(
                { type: 'reference', value: readFormula(only, context) },
                element,
                context,
            );
        case 'formulaExpression':
            return criterionValueOf(
                { type: 'formula', value: readFormula(only, context) },
                element,
                context,
            );
        default:
            return criterionValueOf(
                { type: 'value', value: only.text, valueType: only.name },
                element,
                context,
            );
    }
};

/** Flow の条件の行 (conditions: leftValueReference・operator・rightValue、filters: field・operator・value) */
export const makeFlowCriterionJson = (
    element: XmlElement,
    names: { left: string; value: string },
    context: ReadContext,
): CriterionJson => {
    const left = childOf(element, names.left);
    const operator = childOf(element, 'operator')?.text;
    const value = childOf(element, names.value);
    const right = value ? flowValueOf(value, context) : undefined;
    return makeSpanJson<CriterionJson>(
        'criterion',
        {
            left: left ? readFormula(left, context) : '',
            ...(operator !== undefined ? { operator } : {}),
            ...(right ? { right } : {}),
        },
        element,
        element.file ?? context.file,
        context.registry,
    );
};

/**
 * 値の木の要素に kind と位置を付けたノード (段階 M8。docs/metadata-json-review.md 7.1 の #8)。
 * 中身は値の木と同じ (要素名をプロパティ名にしたもの)。参照・解析に使う値の木の大事なところだけに使う
 */
export type KindedTreeJson<K extends string = string> = JsonType<K> & Record<string, unknown>;

const makeKindedTree = (
    kind: string,
    element: XmlElement,
    options: ValueTreeOptions,
    context: ReadContext,
): KindedTreeJson =>
    makeSpanJson<KindedTreeJson>(
        kind,
        toValueTreeProperties(element, options) as Omit<KindedTreeJson, 'kind' | 'sourceKeys'>,
        element,
        element.file ?? context.file,
        context.registry,
    );

/** Flow の値の木で kind を付ける要素 (要素名 → kind) */
const FLOW_TREE_KINDS: Readonly<Record<string, string>> = {
    // アクション・Apex プラグインの引数 (name + value / assignToReference)
    inputParameters: 'flowParameter',
    outputParameters: 'flowParameter',
    // サブフロー・レコードの操作の割り当て (name / field + value / assignToReference)
    inputAssignments: 'flowAssignment',
    outputAssignments: 'flowAssignment',
    // レコードトリガーの Flow のスケジュールの経路
    scheduledPaths: 'flowScheduledPath',
};

/** Record 系の値の木で kind を付ける要素 (要素名 → kind) */
const RECORD_TREE_KINDS: Readonly<Record<string, string>> = {
    // 共有ルールの共有先・共有元 (role・group・queue など)
    sharedTo: 'sharingPrincipals',
    sharedFrom: 'sharingPrincipals',
    // 承認のステップの承認者 (name・type)
    approver: 'approver',
};

/** 数字を含むときだけ booleanFilter の木にする (Flow の conditionLogic の and / or はそのまま) */
const readCustomLogic = (element: XmlElement, context: ReadContext): FilterLogicValue =>
    /\d/.test(element.text) ? readFilterLogic(element, context) : element.text;

/**
 * Flow の値の木の変換 (段階 M7): 条件の行・数式の値・画面のテキストのテンプレート・独自の条件の組み合わせ。
 * ほかの要素は undefined (値の木のまま)
 */
export const flowTreeConverter =
    (context: ReadContext, options: ValueTreeOptions = {}) =>
    (element: XmlElement): unknown => {
        // 引数・割り当て・スケジュールの経路は、中身 (値の木) はそのまま kind と位置を付ける (段階 M8)
        const kind = FLOW_TREE_KINDS[element.name];
        if (kind && element.children.length) return makeKindedTree(kind, element, options, context);
        switch (element.name) {
            case 'conditions':
                return makeFlowCriterionJson(
                    element,
                    { left: 'leftValueReference', value: 'rightValue' },
                    context,
                );
            case 'filters':
                return makeFlowCriterionJson(element, { left: 'field', value: 'value' }, context);
            case 'conditionLogic':
            case 'filterLogic':
                return element.children.length ? undefined : readCustomLogic(element, context);
            case 'fieldText':
            case 'helpText':
                return element.children.length ? undefined : readTemplate(element, context);
        }
        // <value><formulaExpression>…</formulaExpression></value> の数式
        const [only] = element.children;
        if (element.children.length === 1 && only!.name === 'formulaExpression') {
            return { type: 'formulaExpression', value: readFormula(only!, context) };
        }
        return undefined;
    };

/** 承認・割り当て・エスカレーション・自動応答のルールの値の木の変換 (段階 M7): 条件の行・数式・booleanFilter */
export const recordTreeConverter =
    (context: ReadContext, options: ValueTreeOptions = {}) =>
    (element: XmlElement): unknown => {
        // 共有先・承認者は、中身 (値の木) はそのまま kind と位置を付ける (段階 M8)
        const kind = RECORD_TREE_KINDS[element.name];
        if (kind && element.children.length) return makeKindedTree(kind, element, options, context);
        switch (element.name) {
            case 'criteriaItems':
                return makeCriterionJson(element, CRITERIA_ITEM_NAMES, context);
            case 'formula':
                return element.children.length ? undefined : readFormula(element, context);
            case 'booleanFilter':
                return element.children.length ? undefined : readFilterLogic(element, context);
        }
        return undefined;
    };
