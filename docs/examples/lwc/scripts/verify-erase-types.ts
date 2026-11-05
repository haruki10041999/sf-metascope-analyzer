/**
 * TS の型を空白にする方式 (docs/lwc-implementation.md 4 章) の検証。@babel/parser で TS を parse し、
 * 型の部分だけを空白にした JS を作って、次を確かめる。
 *
 * 1. 長さと改行の位置が元と同じで、空白にした文字以外は変わっていないこと (位置がずれない)
 * 2. 空白にした JS が、JavaScript として parse できること (型が残っていない)
 * 3. 空白にした JS が @lwc/compiler を通ること。LWC の仕様違反の位置が、元の TS の位置と一致すること
 * 4. 空白にできない構文 (enum など) を見つけて報告すること
 * 5. 位置 (文字位置・行・列) が、日本語・サロゲートペアを含むソースで正しいこと
 *
 * JS / TS の解析は Babel に決めた (SWC と比べて、情報の欠けがなく、位置が Apex と同じ形で、LWC Compiler と同じ parser)。
 *
 * 実行: npx ttsx --noCheck docs/examples/lwc/scripts/verify-erase-types.ts (--print で空白にした JS を表示)
 */
import * as lwc from '@lwc/compiler';
import { parse as babelParse } from '@babel/parser';

import {
    BABEL_TS_OPTIONS,
    eraseTypes,
} from '../../../../src/analyzer/parser/Lwc/validate/eraseTypes';

// ---------------------------------------------------------------------------
// 検証
// ---------------------------------------------------------------------------

type Case = {
    name: string;
    source: string;
    /** @lwc/compiler の結果。ok か、仕様違反のコードと元の TS での位置 (行は 1 始まり、列は 0 始まり) */
    lwc?: { ok: true } | { code: string; line: number; column: number };
    unsupported?: string[];
    /** 空白にしてはいけない文字列 (文字列リテラルの中など) */
    keep?: string[];
};

const component = `// 日本語のコメント 😀 (サロゲートペアを含む)
import { LightningElement, api, wire, track } from 'lwc';
import type { Row } from 'c/types';
import { type Options, getRecord, type Mode } from 'lightning/uiRecordApi';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
export type Status = 'open' | 'closed';
export interface Item { id: string; label?: string }
interface Local<T> { value: T }
type Pair<A, B> = [A, B];
declare const DEBUG: boolean;

const pick = <T,>(items: T[], index = 0): T | undefined => items[index];
function bound(this: Window, n: number): number {
    return n;
}
const unbound = function (this: Map<string, [number, string]>): void {};
void bound;
void unbound;

export default class Hello extends LightningElement implements Local<string> {
    @api recordId!: string;
    @api public readonly label?: string = 'ラベル: as private x?: y';
    @track private items: Row[] = [];
    @wire(getAccounts, { id: '$recordId' }) accounts?: { data?: Row[]; error?: unknown };
    value: string = '';
    declare extra: number;
    private static count: number = 0;
    [key: string]: unknown;

    get first(): Row | undefined {
        return pick<Row>(this.items);
    }

    handle(event: CustomEvent<{ id: string }>, mode?: Mode): void {
        const detail = event.detail as { id: string };
        const row = this.items.find((r) => r.Id === detail.id)!;
        const opts = { mode } satisfies Partial<Options>;
        const n = <number>(row as unknown);
        const m = (row) as unknown as Row;
        void m;
        let later!: number;
        later = n;
        this.dispatchEvent(new CustomEvent('select', { detail: { row, opts, later } }));
    }

    overload(x: string): string;
    overload(x: number): number;
    overload(x: unknown): unknown {
        return x;
    }

    withThis(this: Hello, n: number): number {
        return n;
    }

    private async load(): Promise<void> {
        const data = (await getAccounts({ id: this.recordId })) as Row[] | undefined;
        this.items = data ?? [];
        const kinds = ['a', 'b'] as const;
        void kinds;
    }
}

abstract class Base<T> {
    abstract run(): T;
    protected abstract name: string;
    constructor() {}
}
void Base;
void getRecord;
`;

const CASES: Case[] = [
    {
        name: 'コンポーネント (型の構文をひととおり含む)',
        source: component,
        lwc: { ok: true },
        keep: ["'ラベル: as private x?: y'", "'$recordId'", "'select'", '😀'],
    },
    {
        name: 'LWC の仕様違反の位置が TS の位置と一致する (@api と @track の併用)',
        source: `import { LightningElement, api, track } from 'lwc';\ntype T = { a: string };\nexport default class X extends LightningElement {\n    // 日本語\n    @api @track value: T = { a: '' };\n}\n`,
        lwc: { code: 'LWC1093', line: 5, column: 4 },
    },
    {
        name: '空白にできない構文',
        source: `export enum Color { Red, Blue }\nnamespace N { export const x = 1; }\nclass P { constructor(private x: number) {} }\nimport fs = require('fs');\n`,
        unsupported: ['enum', 'namespace / module', 'parameter property', 'import = require'],
    },
];

const lineColumnOf = (source: string, offset: number) => {
    const before = source.slice(0, offset);
    const line = before.split('\n').length;
    return { line, column: offset - (before.lastIndexOf('\n') + 1) };
};

const results: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail = '') => results.push({ name, ok, detail });

for (const c of CASES) {
    const { code, unsupported } = eraseTypes(c.source);

    if (c.unsupported) {
        check(
            `${c.name}: 報告`,
            JSON.stringify(unsupported.map((u) => u.syntax)) === JSON.stringify(c.unsupported),
            unsupported
                .map((u) => `${u.syntax}@${lineColumnOf(c.source, u.start).line}`)
                .join(', '),
        );
        continue;
    }

    // 1. 位置がずれない
    const newlines = (s: string) => [...s.matchAll(/\n/g)].map((m) => m.index).join(',');
    // 文字位置 (UTF-16 の単位) で比べる ([...code] はコードポイント単位になるので使わない)
    const onlyBlanked = code.split('').every((ch, i) => ch === c.source[i] || ch === ' ');
    check(
        `${c.name}: 長さ・改行・空白以外の文字`,
        code.length === c.source.length && newlines(code) === newlines(c.source) && onlyBlanked,
    );
    for (const text of c.keep ?? []) {
        check(`${c.name}: 残す文字列 ${text}`, code.includes(text));
    }

    // 2. JS として parse できる (型が残っていない)
    try {
        babelParse(code, {
            sourceType: 'module',
            plugins: [['decorators', { decoratorsBeforeExport: true }]],
        });
        check(`${c.name}: JavaScript として parse`, true);
    } catch (e) {
        check(
            `${c.name}: JavaScript として parse`,
            false,
            String((e as Error).message).slice(0, 300),
        );
    }

    // 3. @lwc/compiler
    if (c.lwc) {
        try {
            lwc.transformSync(code, 'x.js', { namespace: 'c', name: 'x' });
            check(`${c.name}: @lwc/compiler`, 'ok' in c.lwc, '通った');
        } catch (e: any) {
            const actual = {
                code: String(e.message).match(/LWC\d+/)?.[0],
                line: e.location?.line,
                column: e.location?.column,
            };
            const expected = 'ok' in c.lwc ? undefined : c.lwc;
            check(
                `${c.name}: @lwc/compiler`,
                !!expected &&
                    actual.code === expected.code &&
                    actual.line === expected.line &&
                    actual.column === expected.column,
                `${JSON.stringify(actual)} ${String(e.message).split('\n')[0].slice(0, 160)}`,
            );
        }
    }
}

// Babel の位置は文字位置 (UTF-16) と行 (1 始まり)・列 (0 始まり) をそのまま持つ (Apex の SourcePosition と同じ)
{
    const ast: any = babelParse(component, BABEL_TS_OPTIONS as any);
    const cls = ast.program.body.find(
        (n: any) => n.type === 'ExportDefaultDeclaration',
    ).declaration;
    const names = cls.body.body
        .filter((m: any) => m.key)
        .map((m: any) => component.slice(m.key.start, m.key.end));
    const label = cls.body.body.find((m: any) => m.key?.name === 'label');
    const at = lineColumnOf(component, label.key.start);
    check(
        '位置 (メンバー名・行・列)',
        names.includes('label') &&
            names.includes('withThis') &&
            label.key.loc.start.line === at.line &&
            label.key.loc.start.column === at.column,
        `${names.join(',')} label=${label.key.loc.start.line}:${label.key.loc.start.column}`,
    );
}

const failed = results.filter((r) => !r.ok);
results.forEach((r) =>
    console.log(`${r.ok ? 'OK ' : 'NG '} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`),
);
console.log(failed.length ? `\n${failed.length} 件失敗` : '\nすべて成功');
if (process.argv.includes('--print')) {
    console.log('\n--- 空白にした JS ---\n' + eraseTypes(component).code);
}
process.exitCode = failed.length ? 1 : 0;
