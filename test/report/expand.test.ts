import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { loadSampleInput } from '../../docs/examples/report/scripts/run-report';
import type { ReportInput } from '../../src/analyzer/report';
import { type ResolvedReport, resolveReport } from '../../src/builder/reportBuilder';
import { comparisonsOf } from '../../src/report/document';
import { ReportView } from '../../src/viewer/report/view';
import {
    apexSpecificationTemplate,
    lwcOverviewTemplate,
    objectDefinitionTemplate,
} from '../../src/report/templates';

// for / if / $note の展開 (docs/todo.md 3.2.1 の 2)。サンプルは docs/examples/repository

const stack = (children: string[], extra: Record<string, unknown> = {}) => ({
    type: 'Stack',
    props: { direction: 'vertical', gap: 'md', align: null, justify: null, className: null },
    children,
    ...extra,
});

const card = (title: string, children: string[], extra: Record<string, unknown> = {}) => ({
    type: 'Card',
    props: { title, description: null, maxWidth: 'full', centered: null, className: null },
    children,
    ...extra,
});

const table = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
    type: 'DataTable',
    props: { columns: null, caption: null, onlyChanged: null },
    children: [],
    data,
    ...extra,
});

const narrative = (markdown: unknown, extra: Record<string, unknown> = {}) => ({
    type: 'Narrative',
    props: { title: null, markdown },
    children: [],
    ...extra,
});

const METHODS = {
    provider: 'apex.outline',
    args: { classes: ['AccountService'] },
    where: { memberType: 'method' },
};

const ok = (resolved: ResolvedReport) => {
    assert.ok(resolved.ok, JSON.stringify(!resolved.ok && resolved.issues));
    return resolved;
};

describe('for / if / $note の展開', () => {
    let input: ReportInput;
    before(async () => {
        input = { after: (await loadSampleInput()).after };
    });

    it('クラスの仕様書: メソッドごとにカード・文章・データアクセス (行があるときだけ)', () => {
        const resolved = ok(
            resolveReport(
                {
                    title: 'AccountService',
                    data: {},
                    notes: { 'AccountService.sync': '取引先を同期する。' },
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['method']),
                            method: card('${m.name}(${m.params})', ['note', 'soql'], {
                                for: { as: 'm', in: METHODS },
                            }),
                            note: narrative({ $note: '${m.owner}.${m.name}' }),
                            soql: table(
                                {
                                    provider: 'apex.dataAccess',
                                    args: { classes: ['AccountService'] },
                                    where: { member: '${m.owner}.${m.name}' },
                                },
                                { if: { hasRows: true } },
                            ),
                        },
                    },
                },
                input,
            ),
        );
        const { elements, root, state } = resolved.report.spec;
        const cards = elements[root]!.children!;
        assert.equal(cards.length, 13);
        assert.equal(cards[0], 'method__0');
        const titles = cards.map((key) => elements[key]!.props.title);
        assert.ok(titles.includes('sync(Set<Id>)'));
        assert.ok(titles.includes('calc(Integer, Integer)'));
        // データアクセスのあるメソッド (sync・search・stats・expressions) だけに表がある
        const sync = elements[cards[titles.indexOf('sync(Set<Id>)')]!]!;
        assert.equal(sync.children!.length, 2);
        assert.equal(elements[cards[titles.indexOf('reset()')]!]!.children!.length, 1);
        const tables = Object.keys(elements).filter((key) => key.startsWith('soql__'));
        assert.equal(tables.length, 5); // sync・process・search・stats・expressions
        const data = state.data as Record<string, { member: string }[]>;
        const syncRows = data[tables.find((key) => sync.children!.includes(key))!]!;
        assert.ok(syncRows.every((row) => row.member === 'AccountService.sync'));
        // 文章: notes にあれば入れ、なければ (未記入) にして警告する
        const note = elements[sync.children![0]!]!;
        assert.equal(note.props.markdown, '取引先を同期する。');
        assert.equal(resolved.warnings!.length, 12);
        assert.match(resolved.warnings![0]!.path, /^spec\.note\[\d+\]\.props$/);
    });

    it('入れ子の for と、for の変数 ($index・$number・行の値そのもの)', () => {
        const resolved = ok(
            resolveReport(
                {
                    title: 't',
                    data: {
                        classes: {
                            provider: 'metadata.units',
                            args: {
                                types: ['apexClass'],
                                names: ['AccountService', 'AccountTriggerHandler'],
                            },
                        },
                    },
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['cls']),
                            cls: card('${c.$number}. ${c.name}', ['method'], {
                                for: { as: 'c', in: 'classes' },
                            }),
                            method: narrative('${c.name}#${m.name} (${m.$index})', {
                                for: {
                                    as: 'm',
                                    in: {
                                        provider: 'apex.outline',
                                        args: { classes: ['${c.name}'] },
                                        where: { memberType: 'method' },
                                    },
                                    limit: 2,
                                },
                            }),
                        },
                    },
                },
                input,
            ),
        );
        const { elements } = resolved.report.spec;
        assert.equal(elements.cls__0!.props.title, '1. AccountService');
        assert.deepEqual(elements.cls__0!.children, ['method__0__0', 'method__0__1']);
        assert.match(elements.method__0__1!.props.markdown as string, /^AccountService#\w+ \(1\)$/);
        // 上限を超えた行は出さず、警告する (場所は繰り返した要素)
        assert.ok(resolved.warnings!.some((w) => /^spec\.method\[0\]\.for$/.test(w.path)));
    });

    it('if: 値の比べ方と all / any / not。文章の中の for でない ${...} はそのまま', () => {
        const condition = (value: unknown, test: Record<string, unknown>) =>
            narrative('x', { if: { value, ...test } });
        const resolved = ok(
            resolveReport(
                {
                    title: 't',
                    data: {},
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['row']),
                            row: stack(
                                ['eq', 'neq', 'in', 'exists', 'gt', 'all', 'any', 'not', 'code'],
                                {
                                    for: { as: 'm', in: { ...METHODS, where: { name: 'sync' } } },
                                },
                            ),
                            eq: condition('${m.name}', { eq: 'sync' }),
                            neq: condition('${m.name}', { neq: 'sync' }),
                            in: condition('${m.name}', { in: ['calc', 'sync'] }),
                            exists: condition('${m.params}', { exists: false }),
                            gt: condition('${m.$number}', { gt: 0 }),
                            all: narrative('x', {
                                if: {
                                    all: [
                                        { value: '${m.name}', eq: 'sync' },
                                        { value: '${m.static}' },
                                    ],
                                },
                            }),
                            any: narrative('x', {
                                if: {
                                    any: [{ value: '${m.name}', eq: 'x' }, { value: '${m.name}' }],
                                },
                            }),
                            not: narrative('x', {
                                if: { not: { value: '${m.name}', eq: 'sync' } },
                            }),
                            code: narrative('`${total}` と ${m.name}'),
                        },
                    },
                },
                input,
            ),
        );
        const { elements } = resolved.report.spec;
        assert.deepEqual(elements.row__0!.children, [
            'eq__0',
            'in__0',
            'gt__0',
            'all__0',
            'any__0',
            'code__0',
        ]);
        assert.equal(elements.code__0!.props.markdown, '`${total}` と sync');
    });

    it('問題: 場所は繰り返した要素 (key[n]) と書いた場所で返す', () => {
        const resolved = resolveReport(
            {
                title: 't',
                data: {},
                spec: {
                    root: 'page',
                    elements: {
                        page: stack(['method', 'unknown', 'object', 'orphanParent'], {
                            for: undefined,
                        }),
                        method: card('${m.name}', ['bad'], {
                            for: { as: 'm', in: { ...METHODS, where: { name: 'sync' } } },
                        }),
                        bad: table({ provider: 'object.fields', args: { objects: '${m.name}' } }),
                        unknown: card('u', [], { for: { as: 'u', in: 'nothing' } }),
                        object: card('o', [], {
                            for: { as: 'o', in: { provider: 'object.diagram' } },
                        }),
                        orphanParent: card('p', ['inner']),
                        inner: card('i', [], {
                            for: { as: 'p', in: { provider: 'flow.list' } },
                        }),
                        lost: card('lost', []),
                    },
                },
            },
            input,
        );
        assert.ok(!resolved.ok);
        const paths = resolved.issues.map((issue) => issue.path);
        assert.ok(paths.includes('spec.bad[0].data.args.objects'), paths.join(', '));
        assert.ok(paths.includes('spec.unknown.for.in'), paths.join(', '));
        assert.ok(paths.includes('spec.object.for.in'), paths.join(', '));
        assert.ok(paths.includes('spec.lost'), paths.join(', '));
    });

    it('hasRows にデータの宣言を書ける (見出しのカードごと消す)。"${x}" だけで値がなければ null', () => {
        const resolved = ok(
            resolveReport(
                {
                    title: 't',
                    data: {},
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['section']),
                            section: card('${m.name}', ['rows'], {
                                for: {
                                    as: 'm',
                                    in: { ...METHODS, where: { name: ['sync', 'describe'] } },
                                },
                                if: {
                                    hasRows: {
                                        provider: 'apex.dataAccess',
                                        args: { classes: ['AccountService'] },
                                        where: { member: '${m.owner}.${m.name}' },
                                    },
                                },
                            }),
                            rows: {
                                ...narrative('x'),
                                props: { title: '${m.nothing}', markdown: 'x' },
                            },
                        },
                    },
                },
                input,
            ),
        );
        const { elements, root } = resolved.report.spec;
        // データアクセスのない describe のカードは出さない
        assert.deepEqual(
            elements[root]!.children!.map((key) => elements[key]!.props.title),
            ['sync'],
        );
        assert.equal(elements.rows__0!.props.title, null);
    });

    it('雛形: すべてのクラス・コンポーネント・オブジェクトを 1 件 1 ページに広げる (個々のデータは指定しない)', () => {
        const count = (
            reports: { spec: { elements: Record<string, { type: string }> } }[],
            type: string,
        ) =>
            reports.flatMap((r) => Object.values(r.spec.elements)).filter((e) => e.type === type)
                .length;
        const apex = ok(resolveReport(apexSpecificationTemplate(), input));
        const apexPages = apex.pages!.map((page) => page.report);
        const titles = apexPages.map((page) => page.title);
        assert.ok(titles.includes('AccountService') && titles.includes('AccountTrigger'));
        // 目次はページへのリンク
        assert.equal(count([apex.report], 'PageLink'), apexPages.length);
        assert.ok(count(apexPages, 'CodeFlowchart') > 14);
        assert.ok(
            apex.warnings!.some((w) => w.message.includes('AccountService.calc(Integer, Integer)')),
        );
        // ページには、そのページのデータだけ
        const service = apex.pages!.find((page) => page.report.title === 'AccountService')!;
        assert.equal(service.file, 'pages/AccountService.html');
        assert.equal(service.report.parent!.href, '../index.html');
        // 目次はデータを持たない。ページのデータは、そのクラスの繰り返し (同じ __<n>) のものだけ
        assert.deepEqual(Object.keys(apex.report.spec.state.data as object), []);
        const names = Object.keys(service.report.spec.state.data as object);
        const index = service.report.spec.root.match(/__(\d+)$/)![1];
        assert.ok(names.length > 0);
        assert.ok(
            names.every((name) => name.match(/__(\d+)/)?.[1] === index),
            names.join(', '),
        );
        const lwc = ok(resolveReport(lwcOverviewTemplate(), input));
        assert.ok(
            count(
                lwc.pages!.map((p) => p.report),
                'EventFlow',
            ) >= 1,
        );
        const objects = ok(resolveReport(objectDefinitionTemplate(), input));
        assert.ok(objects.pages!.some((page) => page.report.title === 'Invoice__c'));
    });

    it('文書の引数 (構成の値): ${params.x} を題・データの引数・props に入れ、渡した値は default より優先', () => {
        // 個々のデータの名前ではなく、構成の値 (見せるメンバーの種類・見出し) を引数にする
        const document = {
            title: 'メンバーの一覧 (${params.memberTypes})',
            params: {
                memberTypes: { default: ['method'], description: '見せるメンバーの種類' },
                heading: { description: '見出し' },
            },
            data: {},
            spec: {
                root: 'page',
                elements: {
                    page: stack(['outline']),
                    outline: card('${params.heading}', ['rows']),
                    rows: table({
                        provider: 'apex.outline',
                        where: { memberType: '${params.memberTypes}' },
                    }),
                },
            },
        };
        const types = (resolved: ResolvedReport) =>
            new Set(
                (
                    (resolved.ok ? resolved.report.spec.state.data : {}) as Record<
                        string,
                        { memberType: string }[]
                    >
                ).rows!.map((row) => row.memberType),
            );
        const withDefault = ok(resolveReport(document, input, { params: { heading: 'メンバー' } }));
        assert.equal(withDefault.report.title, 'メンバーの一覧 (method)');
        assert.equal(withDefault.report.spec.elements.outline!.props.title, 'メンバー');
        assert.deepEqual([...types(withDefault)], ['method']);
        const other = ok(
            resolveReport(document, input, {
                params: { memberTypes: ['constructor', 'property'], heading: 'x' },
            }),
        );
        assert.deepEqual([...types(other)].sort(), ['constructor', 'property']);
        // 値も default もない引数・宣言していない引数は問題にする
        const missing = resolveReport(document, input, { params: { unknown: 1 } });
        assert.ok(!missing.ok);
        assert.deepEqual(missing.issues.map((issue) => issue.path).sort(), [
            'params.heading',
            'params.unknown',
        ]);
    });

    it('展開した文書は、手で展開した文書と同じ HTML になる', () => {
        const access = (member: string) => ({
            provider: 'apex.dataAccess',
            args: { classes: ['AccountService'] },
            where: { member },
        });
        const notes = { 'AccountService.sync': '同期する。' };
        // for・${m.x}・$note・if (hasRows) で書いた文書
        const written = ok(
            resolveReport(
                {
                    title: 't',
                    data: {},
                    notes,
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['method']),
                            method: card('${m.$number}. ${m.name}', ['body', 'access'], {
                                for: {
                                    as: 'm',
                                    in: { ...METHODS, where: { name: ['sync', 'describe'] } },
                                },
                            }),
                            body: narrative({ $note: '${m.owner}.${m.name}' }),
                            access: table(access('${m.owner}.${m.name}'), {
                                if: { hasRows: true },
                            }),
                        },
                    },
                },
                input,
            ),
        );
        // 同じものを手で書いた文書 (キーは展開と同じ <キー>__<n>)
        const byHand = ok(
            resolveReport(
                {
                    title: 't',
                    data: {},
                    spec: {
                        root: 'page',
                        elements: {
                            page: stack(['method__0', 'method__1']),
                            method__0: card('1. sync', ['body__0', 'access__0']),
                            body__0: narrative('同期する。'),
                            access__0: table(access('AccountService.sync')),
                            method__1: card('2. describe', ['body__1']),
                            body__1: narrative('(未記入: AccountService.describe)'),
                        },
                    },
                },
                input,
            ),
        );
        const html = (resolved: typeof written) =>
            renderToString(createElement(ReportView, { report: resolved.report }));
        assert.deepEqual(written.report.spec, byHand.report.spec);
        assert.equal(html(written), html(byHand));
    });

    it('for・if・$note がなければ、文書をそのまま使う。for の比べ方も先に読む対象', () => {
        const document = {
            title: 't',
            data: { flows: { provider: 'flow.list' } },
            spec: {
                root: 'page',
                elements: {
                    page: stack(['flows']),
                    flows: {
                        ...table({}),
                        data: undefined,
                        props: { ...table({}).props, rows: { $state: '/data/flows' } },
                    },
                },
            },
        };
        const resolved = ok(resolveReport(document, input));
        assert.deepEqual(Object.keys(resolved.report.spec.elements), ['page', 'flows']);
        assert.deepEqual(
            comparisonsOf({
                ...document,
                spec: {
                    root: 'page',
                    elements: {
                        page: stack(['x'], {}),
                        x: card('x', [], {
                            for: {
                                as: 'f',
                                in: { provider: 'flow.list', compare: { from: 'main' } },
                            },
                        }),
                    },
                },
            }),
            [{ kind: 'range', range: { from: 'main' } }],
        );
    });
});
