/**
 * ソースの中の `unknown` の型を数える (docs/plan.md 10 章 P2「`unknown` を型に置き換える」の数え直し)。
 * P1・P2 のあとにも数え直せるよう、置いた場所・書き方ごとに数える:
 *
 *   npx ttsx --noCheck docs/examples/analysis/scripts/unknowns.ts            # 集計
 *   npx ttsx --noCheck docs/examples/analysis/scripts/unknowns.ts --files    # ファイルごと (多い順)
 *   npx ttsx --noCheck docs/examples/analysis/scripts/unknowns.ts --json     # JSON
 *   npx ttsx --noCheck docs/examples/analysis/scripts/unknowns.ts --tests    # test/ も含める
 *
 * TypeScript 7 には JS のコンパイラ API がないので、@babel/parser (typescript のプラグイン) で読む。
 * 置いた場所 (kind):
 * - parameter: 引数の型 (`(x: unknown)`。`Record<string, unknown>` など、型の中にあるものも含む)
 * - property: 型・インターフェース・クラスの属性の型
 * - return: 関数の戻り値の型
 * - variable: 変数の型
 * - cast: `as unknown` / `<unknown>x` / `satisfies`
 * - typeAlias: 型の別名 (`type X = unknown` / `Record<string, unknown>` など)
 * - typeArgument: 呼び出し・new の型引数 (`f<unknown>()`)
 * - other: そのほか (型の引数の制約・既定値など)
 * 書き方 (direct): `unknown` そのものか (true)、ほかの型の中か (`unknown[]`・`Record<string, unknown>`。false)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '@babel/parser';

type Kind =
    | 'parameter'
    | 'property'
    | 'return'
    | 'variable'
    | 'cast'
    | 'typeAlias'
    | 'typeArgument'
    | 'other';

export type UnknownUse = { file: string; line: number; kind: Kind; direct: boolean };

type AstNode = { type: string; loc?: { start: { line: number } } } & Record<string, unknown>;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');

const isNode = (value: unknown): value is AstNode =>
    typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';

const FUNCTION_TYPES = new Set([
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'ObjectMethod',
    'ClassMethod',
    'ClassPrivateMethod',
    'TSDeclareFunction',
    'TSDeclareMethod',
    'TSMethodSignature',
    'TSFunctionType',
    'TSConstructorType',
    'TSCallSignatureDeclaration',
    'TSConstructSignatureDeclaration',
]);

/** 祖先の並び (内側から) から、unknown を置いた場所 */
const kindOf = (ancestors: readonly AstNode[], child: readonly AstNode[]): Kind => {
    for (let i = 0; i < ancestors.length; i++) {
        const node = ancestors[i]!;
        const inner = child[i]!;
        switch (node.type) {
            case 'TSAsExpression':
            case 'TSTypeAssertion':
            case 'TSSatisfiesExpression':
                return 'cast';
            case 'TSPropertySignature':
            case 'ClassProperty':
            case 'ClassPrivateProperty':
            case 'ClassAccessorProperty':
            case 'TSIndexSignature':
                return 'property';
            case 'VariableDeclarator':
                return 'variable';
            case 'TSTypeAliasDeclaration':
                return 'typeAlias';
            case 'TSTypeParameter':
                return 'other';
            case 'CallExpression':
            case 'NewExpression':
            case 'OptionalCallExpression':
            case 'TaggedTemplateExpression':
                return 'typeArgument';
            case 'TSInterfaceDeclaration':
                return 'property';
        }
        if (FUNCTION_TYPES.has(node.type)) {
            // 戻り値の型 (returnType / typeAnnotation) か、引数 (params / parameters)
            if (inner === node.returnType || inner === node.typeAnnotation) return 'return';
            return 'parameter';
        }
    }
    return 'other';
};

/** ファイル 1 つの unknown */
export const unknownsOfSource = (file: string, source: string): UnknownUse[] => {
    const ast = parse(source, {
        sourceType: 'module',
        plugins: ['typescript', ...(file.endsWith('.tsx') ? (['jsx'] as const) : [])],
        errorRecovery: true,
    }) as unknown as AstNode;
    const uses: UnknownUse[] = [];
    const ancestors: AstNode[] = [];
    const visit = (node: AstNode): void => {
        if (node.type === 'TSUnknownKeyword') {
            // 内側からの祖先と、その祖先の直下の子
            const reversed = [...ancestors].reverse();
            const children = [node, ...reversed.slice(0, -1)];
            const parent = reversed[0];
            uses.push({
                file,
                line: node.loc?.start.line ?? 0,
                kind: kindOf(reversed, children),
                direct: parent?.type === 'TSTypeAnnotation' || parent?.type === 'TSAsExpression',
            });
            return;
        }
        ancestors.push(node);
        for (const [key, value] of Object.entries(node)) {
            if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
            if (Array.isArray(value)) {
                for (const item of value) if (isNode(item)) visit(item);
            } else if (isNode(value)) {
                visit(value);
            }
        }
        ancestors.pop();
    };
    visit(ast);
    return uses;
};

const filesOf = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : filesOf(full);
        return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
    });

/** リポジトリの unknown (src。tests なら test も) */
export const unknownsOf = (options: { tests?: boolean } = {}): UnknownUse[] =>
    ['src', ...(options.tests ? ['test'] : [])]
        .flatMap((dir) => filesOf(path.join(root, dir)))
        .flatMap((file) =>
            unknownsOfSource(
                path.relative(root, file).replace(/\\/g, '/'),
                fs.readFileSync(file, 'utf8'),
            ),
        );

/** 場所のまとまり (src/analyzer/processor/Apex/semantic/x.ts → src/analyzer/processor/Apex) */
const areaOf = (file: string): string => file.split('/').slice(0, 4).join('/');

const countBy = <T>(items: readonly T[], keyOf: (item: T) => string): [string, number][] => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

const main = () => {
    const args = new Set(process.argv.slice(2));
    const uses = unknownsOf({ tests: args.has('--tests') });
    const summary = {
        total: uses.length,
        direct: uses.filter((u) => u.direct).length,
        byKind: Object.fromEntries(countBy(uses, (u) => u.kind)),
        directByKind: Object.fromEntries(
            countBy(
                uses.filter((u) => u.direct),
                (u) => u.kind,
            ),
        ),
        byArea: Object.fromEntries(countBy(uses, (u) => areaOf(u.file))),
    };
    if (args.has('--json')) {
        console.log(JSON.stringify(args.has('--files') ? { ...summary, uses } : summary, null, 2));
        return;
    }
    console.log(`unknown: ${summary.total} (そのまま ${summary.direct})`);
    console.log('\n置いた場所 (そのまま / すべて):');
    for (const [kind, n] of Object.entries(summary.byKind)) {
        console.log(
            `  ${kind.padEnd(13)} ${String(summary.directByKind[kind] ?? 0).padStart(4)} / ${String(n).padStart(4)}`,
        );
    }
    console.log('\nまとまりごと:');
    for (const [area, n] of Object.entries(summary.byArea)) {
        console.log(`  ${String(n).padStart(4)}  ${area}`);
    }
    if (args.has('--files')) {
        console.log('\nファイルごと:');
        for (const [file, n] of countBy(uses, (u) => u.file)) {
            console.log(`  ${String(n).padStart(4)}  ${file}`);
        }
    }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
