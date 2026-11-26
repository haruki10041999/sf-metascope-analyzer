import { JsonType } from '../commons/json';
import { makePositionOf } from '../commons/source';
import { SourceFile, SpanSourceRegistry, makeSpanJson } from '../commons/spanJson';
import { type DecodedText, XmlElement, textOffsetsOf } from '../commons/xml';
import type { SourcePosition } from '../commons/source';

// 数式の JSON (docs/json-redesign-plan.md の段階 M4、docs/metadata-json-review.md 5.1)。
// 項目の数式・既定値、入力規則、ワークフロー、クイックアクション、Flow の数式などを、parse のときに 1 回だけ木にする。
// 形は Apex・LWC の式に合わせる (left・operator・right、関数は name・arg)。kind は fx* (決めたこと 2)、
// どのノードも sourceKeys を持つ (決めたこと 7)。読めない数式は文字列のまま持ち、resolvedError に出す (決めたこと 6)

/** 名前 (Amount__c・Account.Owner.Name・$User.Id・$Record.Amount__c)。. で分けた並び */
export type FxNameJson = JsonType<'fxName'> & { path: string[] };
/** 関数の呼び出し (ISPICKVAL(Status__c, 'Paid'))。name は大文字にそろえる */
export type FxCallJson = JsonType<'fxCall'> & { name: string; arg: FxJson[] };
/** 文字列 (引用符を除き、エスケープを戻したもの) */
export type FxStringJson = JsonType<'fxString'> & { value: string };
/** 数 (書いたままの文字列。Apex の数のリテラルと同じく精度を失わないため) */
export type FxNumberJson = JsonType<'fxNumber'> & { value: string };
export type FxBooleanJson = JsonType<'fxBoolean'> & { value: boolean };
export type FxNullJson = JsonType<'fxNull'>;

export type FxBinaryOperator =
    | '+'
    | '-'
    | '*'
    | '/'
    | '^'
    | '&'
    | '='
    | '=='
    | '!='
    | '<>'
    | '<'
    | '>'
    | '<='
    | '>='
    | '&&'
    | '||';

export type FxBinaryJson = JsonType<'fxBinary'> & {
    left: FxJson;
    operator: FxBinaryOperator;
    right: FxJson;
};
/** -x・+x・!x (NOT(x) は関数) */
export type FxUnaryJson = JsonType<'fxUnary'> & { operator: '-' | '+' | '!'; argument: FxJson };
export type FxParenJson = JsonType<'fxParen'> & { expression: FxJson };
/** a ? b : c (Aura の式。段階 M6) */
export type FxConditionalJson = JsonType<'fxConditional'> & {
    test: FxJson;
    consequent: FxJson;
    alternate: FxJson;
};
/** 差し込み {!x} (Flow の数式・テンプレートなど)。Aura の {#x} (一度だけ評価) は once */
export type FxMergeJson = JsonType<'fxMerge'> & { expression: FxJson; once?: true };

/**
 * 差し込みを含む文字列 (Visualforce・Aura の属性値とテキスト、メール、URL、Flow のテキストテンプレート。段階 M6)。
 * parts は書いた順の文字列と差し込み (LWC の jsTemplate の quasis・expressions を 1 つの並びにしたもの)。
 * 読めない差し込みは文字列のまま parts に残す
 */
export type FxTemplateJson = JsonType<'fxTemplate'> & { parts: (string | FxMergeJson)[] };

/** テンプレートのプロパティの値。差し込みがなければ (と読めなければ) 文字列のまま */
export type TemplateValue = FxTemplateJson | string;

export type FxJson =
    | FxNameJson
    | FxCallJson
    | FxStringJson
    | FxNumberJson
    | FxBooleanJson
    | FxNullJson
    | FxBinaryJson
    | FxUnaryJson
    | FxParenJson
    | FxConditionalJson
    | FxMergeJson;

/** 数式のプロパティの値。読めない数式 (と空の数式) は文字列のまま */
export type FormulaValue = FxJson | string;

export const isFxJson = (value: unknown): value is FxJson =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { kind?: unknown }).kind === 'string' &&
    (value as { kind: string }).kind.startsWith('fx');

// ---------------------------------------------------------------------------
// 字句
// ---------------------------------------------------------------------------

type Token = {
    type: 'number' | 'string' | 'name' | 'operator' | 'punct' | 'end';
    value: string;
    /** 数式の文字列の中の範囲 (end は次の文字) */
    start: number;
    end: number;
};

export class FormulaSyntaxError extends Error {
    /** 数式の文字列の中の位置 */
    readonly offset: number;

    constructor(message: string, offset: number) {
        super(message);
        this.name = 'FormulaSyntaxError';
        this.offset = offset;
    }
}

const OPERATORS = [
    '&&',
    '||',
    '==',
    '!=',
    '<>',
    '<=',
    '>=',
    '+',
    '-',
    '*',
    '/',
    '^',
    '&',
    '=',
    '<',
    '>',
    '!',
    '?',
    ':',
];

const ESCAPES: Readonly<Record<string, string>> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f' };

const tokenize = (text: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    while (i < text.length) {
        const ch = text[i]!;
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        // コメント /* */
        if (text.startsWith('/*', i)) {
            const end = text.indexOf('*/', i + 2);
            if (end < 0) throw new FormulaSyntaxError('unterminated comment', i);
            i = end + 2;
            continue;
        }
        const start = i;
        if (ch === '"' || ch === "'") {
            i++;
            let value = '';
            while (i < text.length && text[i] !== ch) {
                if (text[i] === '\\' && i + 1 < text.length) {
                    value += ESCAPES[text[i + 1]!] ?? text[i + 1];
                    i += 2;
                } else {
                    value += text[i];
                    i++;
                }
            }
            if (i >= text.length) throw new FormulaSyntaxError('unterminated string', start);
            i++;
            tokens.push({ type: 'string', value, start, end: i });
            continue;
        }
        if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(text[i + 1] ?? ''))) {
            while (i < text.length && /[0-9.]/.test(text[i]!)) i++;
            tokens.push({ type: 'number', value: text.slice(start, i), start, end: i });
            continue;
        }
        if (/[A-Za-z$_]/.test(ch)) {
            while (i < text.length && /[A-Za-z0-9_$.]/.test(text[i]!)) i++;
            // 最後の . は名前に入れない
            while (i > start + 1 && text[i - 1] === '.') i--;
            tokens.push({ type: 'name', value: text.slice(start, i), start, end: i });
            continue;
        }
        if (text.startsWith('{!', i) || text.startsWith('{#', i)) {
            i += 2;
            tokens.push({ type: 'punct', value: text.slice(start, i), start, end: i });
            continue;
        }
        if ('(),}'.includes(ch)) {
            i++;
            tokens.push({ type: 'punct', value: ch, start, end: i });
            continue;
        }
        const operator = OPERATORS.find((op) => text.startsWith(op, i));
        if (operator) {
            i += operator.length;
            tokens.push({ type: 'operator', value: operator, start, end: i });
            continue;
        }
        throw new FormulaSyntaxError(`unexpected character \`${ch}\``, i);
    }
    tokens.push({ type: 'end', value: '', start: text.length, end: text.length });
    return tokens;
};

// ---------------------------------------------------------------------------
// 構文 (位置つきの木。JSON にする前の形で、フィールドの名前は JSON と同じ)
// ---------------------------------------------------------------------------

/** 位置つきの数式の木 (JSON の sourceKeys の代わりに、数式の文字列の中の範囲を持つ) */
export type FxSyntax = {
    kind: FxJson['kind'];
    start: number;
    end: number;
    [field: string]: unknown;
};

/** 差し込み 1 つの範囲 (テンプレートの文字列の中)。inner は {! / {# と } の間 */
type MergeRange = {
    start: number;
    end: number;
    innerStart: number;
    innerEnd: number;
    once: boolean;
};

/** テンプレートの中の差し込み ({!...} / {#...}) の範囲 (書いた順)。引用符の中の } は閉じない */
const mergeRangesOf = (text: string): MergeRange[] => {
    const ranges: MergeRange[] = [];
    let i = 0;
    while (i < text.length) {
        if (!(text.startsWith('{!', i) || text.startsWith('{#', i))) {
            i++;
            continue;
        }
        const start = i;
        let j = i + 2;
        let quote: string | undefined;
        while (j < text.length) {
            const ch = text[j]!;
            if (quote) {
                if (ch === '\\') j++;
                else if (ch === quote) quote = undefined;
            } else if (ch === "'" || ch === '"') {
                quote = ch;
            } else if (ch === '}') {
                break;
            }
            j++;
        }
        if (j >= text.length) break;
        ranges.push({
            start,
            end: j + 1,
            innerStart: start + 2,
            innerEnd: j,
            once: text[start + 1] === '#',
        });
        i = j + 1;
    }
    return ranges;
};

/** 優先度の低い順。同じ段の演算子は左結合 */
const LEVELS: readonly (readonly string[])[] = [
    ['||'],
    ['&&'],
    ['=', '==', '!=', '<>', '<', '>', '<=', '>='],
    ['+', '-', '&'],
    ['*', '/'],
    ['^'],
];

/** 数式を位置つきの木にする。読めなければ FormulaSyntaxError */
export const parseFormulaSyntax = (text: string): FxSyntax => {
    const tokens = tokenize(text);
    let index = 0;
    const peek = () => tokens[index]!;
    const next = () => tokens[index++]!;
    const fail = (message: string, token: Token = peek()): never => {
        throw new FormulaSyntaxError(message, token.start);
    };
    const expect = (value: string): Token => {
        const token = peek();
        if (token.type !== 'punct' || token.value !== value) fail(`\`${value}\` expected`);
        return next();
    };
    const node = (
        kind: FxJson['kind'],
        start: number,
        end: number,
        fields: Record<string, unknown> = {},
    ): FxSyntax => ({ kind, start, end, ...fields });

    /** a ? b : c (いちばん弱い。右結合) */
    const expression = (): FxSyntax => {
        const test = binary(0);
        if (!(peek().type === 'operator' && peek().value === '?')) return test;
        next();
        const consequent = expression();
        if (!(peek().type === 'operator' && peek().value === ':')) fail('`:` expected');
        next();
        const alternate = expression();
        return node('fxConditional', test.start, alternate.end, { test, consequent, alternate });
    };

    const binary = (level: number): FxSyntax => {
        if (level >= LEVELS.length) return unary();
        let left = binary(level + 1);
        for (;;) {
            const token = peek();
            if (token.type !== 'operator' || !LEVELS[level]!.includes(token.value)) return left;
            next();
            const right = binary(level + 1);
            left = node('fxBinary', left.start, right.end, {
                left,
                operator: token.value,
                right,
            });
        }
    };

    const unary = (): FxSyntax => {
        const token = peek();
        if (token.type === 'operator' && ['-', '+', '!'].includes(token.value)) {
            next();
            const argument = unary();
            return node('fxUnary', token.start, argument.end, {
                operator: token.value,
                argument,
            });
        }
        return primary();
    };

    const primary = (): FxSyntax => {
        const token = next();
        switch (token.type) {
            case 'number':
                return node('fxNumber', token.start, token.end, { value: token.value });
            case 'string':
                return node('fxString', token.start, token.end, { value: token.value });
            case 'name': {
                const following = peek();
                if (following.type === 'punct' && following.value === '(') {
                    next();
                    const arg: FxSyntax[] = [];
                    if (!(peek().type === 'punct' && peek().value === ')')) {
                        for (;;) {
                            arg.push(expression());
                            if (peek().type === 'punct' && peek().value === ',') {
                                next();
                                continue;
                            }
                            break;
                        }
                    }
                    const close = expect(')');
                    return node('fxCall', token.start, close.end, {
                        name: token.value.toUpperCase(),
                        arg,
                    });
                }
                const lower = token.value.toLowerCase();
                if (lower === 'true' || lower === 'false') {
                    return node('fxBoolean', token.start, token.end, { value: lower === 'true' });
                }
                if (lower === 'null') return node('fxNull', token.start, token.end);
                return node('fxName', token.start, token.end, { path: token.value.split('.') });
            }
            case 'punct':
                if (token.value === '(') {
                    const inner = expression();
                    const close = expect(')');
                    return node('fxParen', token.start, close.end, { expression: inner });
                }
                if (token.value === '{!' || token.value === '{#') {
                    const inner = expression();
                    const close = expect('}');
                    return node('fxMerge', token.start, close.end, {
                        expression: inner,
                        ...(token.value === '{#' ? { once: true } : {}),
                    });
                }
                return fail(`unexpected \`${token.value}\``, token);
            case 'end':
                return fail('expression expected', token);
            default:
                return fail(`unexpected \`${token.value}\``, token);
        }
    };

    const root = expression();
    if (peek().type !== 'end') fail(`unexpected \`${peek().value}\``);
    return root;
};

/** 数式を位置つきの木にする。読めない・空なら undefined */
export const tryParseFormulaSyntax = (text: string): FxSyntax | undefined => {
    if (text.trim() === '') return undefined;
    try {
        return parseFormulaSyntax(text);
    } catch (error) {
        if (error instanceof FormulaSyntaxError) return undefined;
        throw error;
    }
};

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/** 読めなかった数式 (resolvedError にする) */
export type FormulaProblem = { message: string; offset: number };

/** 位置つきの木の子 (JSON にするとき、子を先に JSON にする) */
const CHILD_FIELDS = [
    'left',
    'right',
    'argument',
    'expression',
    'test',
    'consequent',
    'alternate',
] as const;

/** 数式・テンプレートの文字列の位置をソースの位置にする道具 */
type Positions = {
    source: SourceFile;
    registry: SpanSourceRegistry;
    /** 文字列の各文字のソースの中の範囲。なければ fallback の範囲 */
    offsets: { starts: number[]; ends: number[] } | undefined;
    fallback: { start: SourcePosition; end: SourcePosition };
    positionOf: (offset: number) => SourcePosition;
};

const spanOf = (positions: Positions, start: number, end: number) =>
    positions.offsets && end > start
        ? {
              start: positions.positionOf(positions.offsets.starts[start]!),
              end: positions.positionOf(positions.offsets.ends[end - 1]!),
          }
        : positions.fallback;

/** 位置つきの木を JSON にする。shift は木の位置を文字列の位置にするずれ (テンプレートの差し込みの中) */
const toFxJson = (node: FxSyntax, positions: Positions, shift = 0): FxJson => {
    const { kind, start, end, ...fields } = node;
    const properties: Record<string, unknown> = { ...fields };
    for (const name of CHILD_FIELDS) {
        if (properties[name]) {
            properties[name] = toFxJson(properties[name] as FxSyntax, positions, shift);
        }
    }
    if (Array.isArray(properties.arg)) {
        properties.arg = (properties.arg as FxSyntax[]).map((arg) =>
            toFxJson(arg, positions, shift),
        );
    }
    return makeSpanJson<FxJson>(
        kind,
        properties as Omit<FxJson, 'kind' | 'sourceKeys'>,
        spanOf(positions, start + shift, end + shift),
        positions.source,
        positions.registry,
    );
};

const positionsOf = (
    file: SourceFile,
    registry: SpanSourceRegistry,
    offsets: { starts: number[]; ends: number[] } | undefined,
    fallback: { start: SourcePosition; end: SourcePosition },
): Positions => ({
    source: file,
    registry,
    offsets,
    fallback,
    positionOf: makePositionOf(file.source),
});

/**
 * XML の要素のテキスト (数式) を JSON にする。読めない・空なら文字列のまま。
 * 読めないときは onProblem に理由と位置 (ソースの中のオフセット) を渡す
 */
export const makeFormulaJson = (
    element: XmlElement,
    file: SourceFile,
    registry: SpanSourceRegistry,
    onProblem?: (problem: FormulaProblem) => void,
): FormulaValue => {
    const text = element.text;
    if (text.trim() === '') return text;
    const source = element.file ?? file;
    const offsets = textOffsetsOf(element, source.source);
    let syntax: FxSyntax;
    try {
        syntax = parseFormulaSyntax(text);
    } catch (error) {
        if (!(error instanceof FormulaSyntaxError)) throw error;
        onProblem?.({
            message: error.message,
            offset: offsets?.starts[error.offset] ?? element.start.offset,
        });
        return text;
    }
    return toFxJson(
        syntax,
        positionsOf(source, registry, offsets, { start: element.start, end: element.end }),
    );
};

/**
 * 差し込みを含む文字列をテンプレートの JSON にする (段階 M6)。差し込みがなければ文字列のまま。
 * decoded はソースから読み戻した文字列と各文字の位置 (なければ fallback の範囲を位置にする)。
 * 読めない差し込みは文字列のまま parts に残し、onProblem に理由と位置を渡す
 */
export const makeTemplateJson = (
    decoded: DecodedText | { text: string; starts?: undefined; ends?: undefined },
    file: SourceFile,
    registry: SpanSourceRegistry,
    fallback: { start: SourcePosition; end: SourcePosition },
    onProblem?: (problem: FormulaProblem) => void,
): TemplateValue => {
    const { text } = decoded;
    const ranges = mergeRangesOf(text);
    if (!ranges.length) return text;
    const offsets = decoded.starts ? { starts: decoded.starts, ends: decoded.ends! } : undefined;
    const positions = positionsOf(file, registry, offsets, fallback);
    const parts: (string | FxMergeJson)[] = [];
    const pushText = (value: string) => {
        if (!value) return;
        const last = parts.at(-1);
        if (typeof last === 'string') parts[parts.length - 1] = last + value;
        else parts.push(value);
    };
    let index = 0;
    for (const range of ranges) {
        pushText(text.slice(index, range.start));
        index = range.end;
        const inner = text.slice(range.innerStart, range.innerEnd);
        let syntax: FxSyntax;
        try {
            syntax = parseFormulaSyntax(inner);
        } catch (error) {
            if (!(error instanceof FormulaSyntaxError)) throw error;
            onProblem?.({
                message: error.message,
                offset:
                    offsets?.starts[range.innerStart + error.offset] ??
                    offsets?.starts[range.start] ??
                    fallback.start.offset,
            });
            pushText(text.slice(range.start, range.end));
            continue;
        }
        parts.push(
            makeSpanJson<FxMergeJson>(
                'fxMerge',
                {
                    expression: toFxJson(syntax, positions, range.innerStart),
                    ...(range.once ? { once: true as const } : {}),
                },
                spanOf(positions, range.start, range.end),
                positions.source,
                positions.registry,
            ),
        );
    }
    pushText(text.slice(index));
    // 読めた差し込みがなければ文字列のまま
    if (parts.every((part) => typeof part === 'string')) return text;
    return makeSpanJson<FxTemplateJson>(
        'fxTemplate',
        { parts },
        spanOf(positions, 0, text.length),
        positions.source,
        positions.registry,
    );
};

/** テンプレート (か文字列) の差し込み (書いた順) */
export const templateMergesOf = (value: unknown): FxMergeJson[] =>
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'fxTemplate'
        ? (value as FxTemplateJson).parts.filter(
              (part): part is FxMergeJson => typeof part !== 'string',
          )
        : [];

/** テンプレート (か文字列) を文字列に戻す */
export const templateTextOf = (value: TemplateValue): string =>
    typeof value === 'string'
        ? value
        : value.parts
              .map((part) => (typeof part === 'string' ? part : formulaTextOf(part)))
              .join('');

// ---------------------------------------------------------------------------
// 文字列に戻す (表示・比べるスクリプト用。空白・引用符は書いたままではない)
// ---------------------------------------------------------------------------

const quote = (value: string): string =>
    `'${value.replace(/[\\'\n\t\r\b\f]/g, (c) => {
        const escaped = Object.entries(ESCAPES).find(([, v]) => v === c)?.[0];
        return `\\${escaped ?? c}`;
    })}'`;

/** 数式の木 (か位置つきの木、読めなかった文字列) を数式の文字列にする */
export const formulaTextOf = (value: FormulaValue | FxSyntax): string => {
    if (typeof value === 'string') return value;
    // 位置つきの木 (FxSyntax) も、フィールドの名前と形は JSON と同じなので、JSON の型で読む
    const node = value as FxJson;
    switch (node.kind) {
        case 'fxName':
            return node.path.join('.');
        case 'fxCall':
            return `${node.name}(${node.arg.map(formulaTextOf).join(', ')})`;
        case 'fxString':
            return quote(node.value);
        case 'fxNumber':
            return node.value;
        case 'fxBoolean':
            return node.value ? 'TRUE' : 'FALSE';
        case 'fxNull':
            return 'NULL';
        case 'fxBinary':
            return `${formulaTextOf(node.left)} ${node.operator} ${formulaTextOf(node.right)}`;
        case 'fxUnary':
            return `${node.operator}${formulaTextOf(node.argument)}`;
        case 'fxParen':
            return `(${formulaTextOf(node.expression)})`;
        case 'fxConditional':
            return `${formulaTextOf(node.test)} ? ${formulaTextOf(node.consequent)} : ${formulaTextOf(node.alternate)}`;
        case 'fxMerge':
            return `{${node.once ? '#' : '!'}${formulaTextOf(node.expression)}}`;
        default:
            return '';
    }
};
