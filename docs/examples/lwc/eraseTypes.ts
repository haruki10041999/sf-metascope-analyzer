// TS の型を空白にする処理 (docs/lwc-parse-plan.md 3.2)。検証は verify-erase-types.ts、使用例は run-library-parse.ts
import { parse as babelParse } from '@babel/parser';

export type Range = [number, number];

export type EraseResult = {
    code: string;
    /** 空白にした範囲 (文字位置) */
    ranges: Range[];
    /** 空白にできない構文 */
    unsupported: { syntax: string; start: number; end: number }[];
};

// ---------------------------------------------------------------------------
// 型を空白にする
// ---------------------------------------------------------------------------

/** Babel の設定。LWC Compiler と同じ decorators の設定に、typescript を足す */
export const BABEL_TS_OPTIONS = {
    sourceType: 'module',
    plugins: ['typescript', ['decorators', { decoratorsBeforeExport: true }]],
    tokens: true,
    // 括弧をノードにする (既定では extra.parenthesized だけになり、(x) as T の中の式の位置が括弧の内側になる)
    createParenthesizedExpressions: true,
} as const;

const BABEL_UNSUPPORTED: Record<string, string> = {
    TSEnumDeclaration: 'enum',
    TSModuleDeclaration: 'namespace / module',
    TSParameterProperty: 'parameter property',
    TSImportEqualsDeclaration: 'import = require',
    TSExportAssignment: 'export =',
    TSNamespaceExportDeclaration: 'export as namespace',
};

/** 丸ごと空白にする宣言 (型だけ・宣言だけで、実行時には何も残らない) */
const BABEL_TYPE_ONLY = new Set([
    'TSInterfaceDeclaration',
    'TSTypeAliasDeclaration',
    'TSDeclareFunction',
    'TSDeclareMethod',
    'TSIndexSignature',
]);

/** そのノードの範囲を丸ごと空白にする、型の位置のノード */
const BABEL_TYPE_POSITIONS = new Set([
    'TSTypeAnnotation',
    'TSTypeParameterDeclaration',
    'TSTypeParameterInstantiation',
]);

const BABEL_MODIFIERS = new Set([
    'public',
    'private',
    'protected',
    'readonly',
    'declare',
    'abstract',
    'override',
]);

export const eraseTypes = (source: string): EraseResult => {
    const ast: any = babelParse(source, BABEL_TS_OPTIONS as any);
    const tokens: { start: number; end: number; text: string }[] = ast.tokens.map((t: any) => ({
        start: t.start,
        end: t.end,
        text: source.slice(t.start, t.end),
    }));
    const ranges: Range[] = [];
    const unsupported: EraseResult['unsupported'] = [];
    const blank = (start: number, end: number) => ranges.push([start, end]);
    /** start〜end のトークンのうち、test に合うものを空白にする */
    const blankTokens = (start: number, end: number, test: (text: string) => boolean) =>
        tokens
            .filter((t) => t.start >= start && t.end <= end && test(t.text))
            .forEach((t) => blank(t.start, t.end));
    /** 後ろのカンマまで (なければ前のカンマから) 空白にする */
    const blankWithComma = (start: number, end: number) => {
        const after = source.slice(end).match(/^\s*,/);
        if (after) return blank(start, end + after[0].length);
        const before = source.slice(0, start).match(/,\s*$/);
        blank(before ? start - before[0].length : start, end);
    };

    const visit = (node: any): void => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
        const type: string = node.type;

        if (BABEL_UNSUPPORTED[type]) {
            unsupported.push({
                syntax: BABEL_UNSUPPORTED[type]!,
                start: node.start,
                end: node.end,
            });
            return;
        }
        const wholeDeclaration =
            BABEL_TYPE_ONLY.has(type) ||
            (type === 'ImportDeclaration' && node.importKind === 'type') ||
            (type === 'ExportNamedDeclaration' &&
                (node.exportKind === 'type' ||
                    BABEL_TYPE_ONLY.has(node.declaration?.type) ||
                    node.declaration?.declare)) ||
            ((type === 'VariableDeclaration' || type === 'ClassDeclaration') && node.declare) ||
            ((type === 'ClassProperty' || type === 'ClassPrivateProperty') &&
                (node.declare || node.abstract));
        if (wholeDeclaration) {
            blank(node.start, node.end);
            return;
        }
        if (
            (type === 'ImportSpecifier' && node.importKind === 'type') ||
            (type === 'ExportSpecifier' && node.exportKind === 'type')
        ) {
            blankWithComma(node.start, node.end);
            return;
        }
        if (BABEL_TYPE_POSITIONS.has(type)) {
            blank(node.start, node.end);
            return;
        }
        // x as T / x satisfies T / x! / f<T> は中の式の後ろから。<T>x は先頭から中の式の前まで
        if (
            type === 'TSAsExpression' ||
            type === 'TSSatisfiesExpression' ||
            type === 'TSNonNullExpression' ||
            type === 'TSInstantiationExpression'
        ) {
            blank(node.expression.end, node.end);
            visit(node.expression);
            return;
        }
        if (type === 'TSTypeAssertion') {
            blank(node.start, node.expression.start);
            visit(node.expression);
            return;
        }
        // this パラメーター (Babel は params の最初の Identifier として持つ)
        if (type === 'Identifier' && node.name === 'this' && node.typeAnnotation) {
            blankWithComma(node.start, node.end);
            return;
        }
        // 修飾子と ?, ! (トークンの位置から)
        if (
            type === 'ClassProperty' ||
            type === 'ClassMethod' ||
            type === 'ClassPrivateProperty' ||
            type === 'ClassPrivateMethod'
        ) {
            const decoratorsEnd = Math.max(
                node.start,
                ...(node.decorators ?? []).map((d: any) => d.end),
            );
            blankTokens(decoratorsEnd, node.key.start, (t) => BABEL_MODIFIERS.has(t));
            const next =
                node.typeAnnotation ?? node.value ?? node.typeParameters ?? node.params?.[0];
            const nextStart = next ? next.start : node.end;
            if (node.optional) blankTokens(node.key.end, nextStart, (t) => t === '?');
            if (node.definite) blankTokens(node.key.end, nextStart, (t) => t === '!');
        }
        if (type === 'Identifier' && node.optional && node.typeAnnotation) {
            blankTokens(node.start + node.name.length, node.typeAnnotation.start, (t) => t === '?');
        }
        if (type === 'VariableDeclarator' && node.definite) {
            const id = node.id;
            blankTokens(
                id.start + id.name.length,
                id.typeAnnotation?.start ?? id.end,
                (t) => t === '!',
            );
        }
        if (
            (type === 'ClassDeclaration' || type === 'ClassExpression') &&
            node.implements?.length
        ) {
            const keyword = tokens.findLast(
                (t) => t.text === 'implements' && t.end <= node.implements[0].start,
            );
            blank(keyword!.start, node.implements[node.implements.length - 1].end);
        }
        if ((type === 'ClassDeclaration' || type === 'ClassExpression') && node.abstract) {
            blankTokens(node.start, node.id?.start ?? node.body.start, (t) => t === 'abstract');
        }

        for (const [key, value] of Object.entries(node)) {
            if (
                key === 'loc' ||
                key === 'implements' ||
                key.endsWith('Comments') ||
                key === 'extra'
            )
                continue;
            visit(value);
        }
    };
    visit(ast.program);

    const chars = source.split('');
    for (const [start, end] of ranges) {
        for (let i = start; i < end; i++) if (chars[i] !== '\n') chars[i] = ' ';
    }
    return { code: chars.join(''), ranges, unsupported };
};
