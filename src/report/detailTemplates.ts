import {
    type ReportProviderArgs,
    type ReportProviderName,
    type ReportProviderSource,
    providerSource,
} from '../analyzer/report/registry';

import type { ReportDocument } from './document';

// for / if / notes / page を使った、1 つずつ詳しく書く雛形 (docs/todo.md 3.2.1 の 6)。
// apex_specification・lwc_overview・object_definition・feature_overview。
// 雛形が決めるのは構成とデータの種類だけで、個々のデータ (どのクラス・オブジェクトか) は指定しない (2026-11-18 に決めた)。
// すべての単位を for で広げ、1 件 1 ページ (page) に分ける (大きい組織でも 1 つの HTML が大きくなりすぎない)。
// 文章は notes に書き、{ "$note": キー } で引く。キーの形は各関数のコメントと MCP のプロンプトの注意に書く

type Element = ReportDocument['spec']['elements'][string];
/** データの宣言 (provider ごとに引数の名前と型を確かめる) */
type Source = ReportProviderSource;
type Column = [key: string, label: string];

const el = (
    type: string,
    props: Record<string, unknown>,
    children: string[] = [],
    extra: Partial<Element> = {},
): Element => ({ type, props, children, ...extra });

const card = (
    title: string,
    description: string | null,
    children: string[],
    extra: Partial<Element> = {},
) =>
    el(
        'Card',
        { title, description, maxWidth: 'full', centered: null, className: null },
        children,
        extra,
    );

const stack = (children: string[], gap: 'md' | 'lg' = 'lg') =>
    el(
        'Stack',
        { direction: 'vertical', gap, align: null, justify: null, className: null },
        children,
    );

const narrative = (title: string | null, markdown: unknown) => el('Narrative', { title, markdown });

const note = (title: string | null, key: string) => narrative(title, { $note: key });

/** 表 (データは要素に書く) */
const table = (source: Source, columns: Column[] | null, extra: Partial<Element> = {}) =>
    el(
        'DataTable',
        {
            columns: columns ? columns.map(([key, label]) => ({ key, label })) : null,
            caption: null,
            onlyChanged: false,
        },
        [],
        { data: source, ...extra },
    );

/** 見出しのカードと、その中の表。行がなければカードごと出さない */
const section = (
    elements: Record<string, Element>,
    key: string,
    title: string,
    source: Source,
    columns: Column[] | null,
) => {
    elements[key] = card(title, null, [`${key}Table`], { if: { hasRows: source } });
    elements[`${key}Table`] = table(source, columns);
    return key;
};

const columns = (ratio: [number, number], children: string[]) =>
    el('Columns', { ratio, gap: null, stackBelow: null, align: null }, children);

const documentOf = (title: string, elements: Record<string, Element>): ReportDocument => ({
    title,
    data: {},
    spec: { root: 'page', elements },
});

// ---------------------------------------------------------------------------
// Apex の仕様書
// ---------------------------------------------------------------------------

/**
 * Apex の仕様書: すべてのクラス・トリガーを 1 件 1 ページに。クラスごとに説明・メンバー、メソッドごとに処理フローと説明 (左右)・
 * データアクセス・呼び出し (シーケンス図)。トリガーは本体の処理フローと呼び出し。
 * notes のキー: クラス・トリガーは名前、メソッドは <owner>.<name>(<引数の型>) (apex.outline の行の owner・name・params)
 */
export const apexSpecificationDetail = (): ReportDocument => {
    const elements: Record<string, Element> = {
        page: stack(['summary', 'unit']),
        summary: narrative(
            '概要',
            '(ここに概要を書く: クラス・トリガーどうしの関係、主な処理の流れ、読み書きするオブジェクト、気をつけること (ループの中の SOQL / DML など))',
        ),
        unit: card('${u.name}', '${u.unitType}', ['unitNote', 'members', 'trigger', 'method'], {
            for: {
                as: 'u',
                in: { provider: 'metadata.units', args: { types: ['apexClass', 'apexTrigger'] } },
                limit: 5000,
            },
            page: { file: '${u.name}' },
        }),
        unitNote: note(null, '${u.name}'),
        trigger: stack(['triggerRow', 'triggerCalls'], 'md'),
        triggerRow: columns([6, 4], ['triggerFlow', 'triggerNote']),
        triggerFlow: el('CodeFlowchart', { member: null, height: null }, [], {
            data: { provider: 'apex.methodFlow', args: { classes: ['${u.name}'] } },
        }),
        triggerNote: narrative(
            '処理の順',
            '(トリガーの本体の流れは左の図。説明は概要と ${u.name} の文章に書く)',
        ),
        method: card(
            '${m.name}(${m.params})',
            '${m.owner} の ${m.memberType}・${m.access}',
            ['methodRow', 'methodAccess', 'methodCalls'],
            {
                for: {
                    as: 'm',
                    in: {
                        provider: 'apex.outline',
                        args: { classes: ['${u.name}'] },
                        where: { memberType: ['method', 'constructor'] },
                    },
                },
            },
        ),
        methodRow: columns([6, 4], ['methodFlow', 'methodNote']),
        methodFlow: el('CodeFlowchart', { member: null, height: null }, [], {
            data: {
                provider: 'apex.methodFlow',
                args: { classes: ['${u.name}'] },
                where: { member: '${m.owner}.${m.name}', signature: '${m.name}(${m.params})' },
            },
            // interface のメソッドなど、本体のないものは図を出さない
            if: { hasRows: true },
        }),
        methodNote: note('説明', '${m.owner}.${m.name}(${m.params})'),
        methodCalls: el('SequenceDiagram', { start: null }, [], {
            data: {
                provider: 'apex.callFlow',
                args: { members: ['${m.owner}.${m.name}'], depth: 2 },
            },
            if: { hasRows: true },
        }),
    };
    // トリガーだけ、本体の処理フローを出す (クラスはメソッドごとに出す)
    elements.trigger!.if = { value: '${u.unitType}', eq: 'apexTrigger' };
    elements.triggerCalls = el('SequenceDiagram', { start: null }, [], {
        data: { provider: 'apex.callFlow', args: { members: ['${u.name}'] } },
        if: { hasRows: true },
    });
    section(
        elements,
        'members',
        'クラス・メンバー',
        { provider: 'apex.outline', args: { classes: ['${u.name}'] } },
        [
            ['owner', '型'],
            ['memberType', '種類'],
            ['name', '名前'],
            ['access', 'アクセス'],
            ['static', 'static'],
            ['params', '引数'],
            ['type', '型・戻り値・対象'],
            ['annotations', 'アノテーション'],
            ['events', 'イベント'],
        ],
    );
    section(
        elements,
        'methodAccess',
        'データアクセス',
        {
            provider: 'apex.dataAccess',
            args: { classes: ['${u.name}'] },
            where: { member: '${m.owner}.${m.name}' },
        },
        [
            ['operation', '操作'],
            ['object', 'オブジェクト'],
            ['fields', '項目'],
            ['inLoop', 'ループの中'],
            ['accessLevel', 'アクセスレベル'],
        ],
    );
    return documentOf('Apex の仕様書', elements);
};

// ---------------------------------------------------------------------------
// LWC
// ---------------------------------------------------------------------------

/** 置かれている Lightning ページ (行がなければ出さない) */
const placementsOf = () => {
    const elements: Record<string, Element> = {};
    section(
        elements,
        'placements',
        '置かれている Lightning ページ',
        { provider: 'lwc.placements' },
        [
            ['lwc', 'コンポーネント'],
            ['flexiPage', 'Lightning ページ'],
            ['pageType', 'ページの種類'],
            ['sobjectType', 'オブジェクト'],
            ['region', 'リージョン'],
        ],
    );
    return elements;
};

/**
 * LWC のコンポーネント: 置かれている Lightning ページと、すべてのコンポーネントを 1 件 1 ページに。
 * コンポーネントごとに説明・画面の骨組み・イベントの流れ、関数ごとに処理フローと説明 (左右)。
 * notes のキー: コンポーネントは c/<名前>、関数は lwc.methodFlow の行の member (<Owner>.<name>)
 */
export const lwcOverviewDetail = (): ReportDocument =>
    documentOf('LWC のコンポーネント', {
        page: stack(['summary', 'placements', 'component']),
        ...placementsOf(),
        summary: narrative(
            '概要',
            '(ここに概要を書く: コンポーネントの親子関係、利用者の操作からデータまでの流れ、使う Apex、気をつけること)',
        ),
        component: card(
            '${c.component}',
            '${c.label}',
            ['componentNote', 'wireframe', 'events', 'function'],
            {
                for: { as: 'c', in: { provider: 'lwc.components' }, limit: 5000 },
                page: { file: '${c.component}' },
            },
        ),
        componentNote: note(null, '${c.component}'),
        wireframe: el('LwcWireframe', { component: null }, [], {
            data: { provider: 'lwc.wireframe', args: { components: ['${c.component}'] } },
        }),
        events: el('EventFlow', { height: null }, [], {
            data: { provider: 'lwc.eventFlow', args: { components: ['${c.component}'] } },
            if: { hasRows: true },
        }),
        function: card('${f.signature}', '${f.owner} の ${f.memberType}', ['functionRow'], {
            for: {
                as: 'f',
                in: { provider: 'lwc.methodFlow', args: { components: ['${c.component}'] } },
            },
        }),
        functionRow: columns([6, 4], ['functionFlow', 'functionNote']),
        functionFlow: el('CodeFlowchart', { member: null, height: null }, [], {
            data: {
                provider: 'lwc.methodFlow',
                args: { components: ['${c.component}'] },
                where: { member: '${f.member}', signature: '${f.signature}' },
            },
        }),
        functionNote: note('説明', '${f.member}'),
    });

// ---------------------------------------------------------------------------
// オブジェクト定義書
// ---------------------------------------------------------------------------

/**
 * オブジェクト定義書のオブジェクトごとの部分: すべてのオブジェクトを 1 件 1 ページに。説明・項目・選択リスト値・入力規則・
 * レコードタイプと選択リスト値・そのほかの定義 (行のあるものだけ)。notes のキー: オブジェクトの API 名
 */
export const objectSections = (): Record<string, Element> => {
    const of = (
        provider: ReportProviderName,
        extra: ReportProviderArgs<ReportProviderName> = {},
    ): Source => providerSource(provider, { objects: ['${o.object}'], ...extra });
    const elements: Record<string, Element> = {
        object: card(
            '${o.object}',
            '${o.label}',
            ['objectNote', 'fields', 'picklists', 'validationRules', 'recordTypes', 'members'],
            {
                for: { as: 'o', in: { provider: 'object.list' }, limit: 5000 },
                page: { file: '${o.object}' },
            },
        ),
        objectNote: note(null, '${o.object}'),
    };
    section(elements, 'fields', '項目', of('object.fields', { includeImplicit: false }), [
        ['field', 'API 名'],
        ['label', 'ラベル'],
        ['type', '型'],
        ['required', '必須'],
        ['length', '長さ'],
        ['referenceTo', '参照先'],
        ['formula', '数式'],
        ['helpText', 'ヘルプ'],
    ]);
    section(elements, 'picklists', '選択リスト値', of('object.picklists'), [
        ['field', '項目'],
        ['order', '順'],
        ['value', '値'],
        ['label', 'ラベル'],
        ['isDefault', '既定'],
        ['isActive', '有効'],
    ]);
    section(elements, 'validationRules', '入力規則', of('object.validationRules'), [
        ['rule', '名前'],
        ['active', '有効'],
        ['condition', 'エラー条件'],
        ['errorMessage', 'エラーメッセージ'],
        ['errorDisplayField', '表示する項目'],
    ]);
    section(
        elements,
        'recordTypes',
        'レコードタイプと選択リスト値',
        of('object.recordTypePicklists'),
        [
            ['recordType', 'レコードタイプ'],
            ['picklist', '選択リスト'],
            ['values', '選べる値'],
            ['defaultValue', '既定'],
        ],
    );
    section(elements, 'members', 'そのほかの定義', of('object.members'), [
        ['memberType', '種類'],
        ['name', '名前'],
        ['label', 'ラベル'],
        ['description', '説明'],
        ['details', '中身'],
    ]);
    return elements;
};

// ---------------------------------------------------------------------------
// 機能のまとまり
// ---------------------------------------------------------------------------

/**
 * 機能のまとまり: カスタムオブジェクトごと (起点) に 1 ページ。起点から依存関係をたどった範囲 (feature.scope) と図、
 * 範囲にある種類ごとの中身 (オブジェクトの項目・Apex のメンバーとデータアクセス・LWC の骨組み・Flow の図・
 * Lightning ページ・ページレイアウト)。起点は利用者が指定せず、カスタムオブジェクトから自動で決める (2026-11-18 に決めた)。
 * notes のキー: 起点のオブジェクトの API 名
 */
export const featureOverviewDetail = (): ReportDocument => {
    const scope = (unitTypes: string[]): Source => ({
        provider: 'feature.scope',
        args: { targets: ['object:${o.object}'] },
        where: { unitType: unitTypes },
    });
    const elements: Record<string, Element> = {
        page: stack(['summary', 'feature']),
        summary: narrative(
            '概要',
            '(ここに概要を書く: 業務の機能のまとまり (カスタムオブジェクトごと) の一覧と、まとまりどうしの関係)',
        ),
        feature: card(
            '${o.label}',
            '${o.object} を起点に、依存関係をたどった範囲',
            [
                'featureNote',
                'scope',
                'graph',
                'objects',
                'classes',
                'components',
                'flows',
                'pages',
                'layouts',
            ],
            {
                for: {
                    as: 'o',
                    in: { provider: 'object.list', where: { objectType: 'custom' } },
                    limit: 5000,
                },
                page: { file: '${o.object}' },
            },
        ),
        featureNote: note(null, '${o.object}'),
        graph: el('DiagramText', { title: null }, [], {
            data: {
                provider: 'dependency.graph',
                args: { targets: ['object:${o.object}'], format: 'mermaid' },
            },
        }),
        objects: card('${u.name}', 'オブジェクト', ['objectFields'], {
            for: { as: 'u', in: scope(['object']) },
        }),
        objectFields: table(
            { provider: 'object.fields', args: { objects: ['${u.name}'], includeImplicit: false } },
            [
                ['field', 'API 名'],
                ['label', 'ラベル'],
                ['type', '型'],
                ['required', '必須'],
                ['referenceTo', '参照先'],
                ['formula', '数式'],
            ],
        ),
        classes: card('${u.name}', '${u.unitType}', ['classOutline', 'classAccess'], {
            for: { as: 'u', in: scope(['apexClass', 'apexTrigger']) },
        }),
        classOutline: table({ provider: 'apex.outline', args: { classes: ['${u.name}'] } }, [
            ['owner', '型'],
            ['memberType', '種類'],
            ['name', '名前'],
            ['params', '引数'],
            ['type', '型・戻り値・対象'],
        ]),
        classAccess: table(
            { provider: 'apex.dataAccess', args: { classes: ['${u.name}'] } },
            [
                ['member', 'メソッド'],
                ['operation', '操作'],
                ['object', 'オブジェクト'],
                ['fields', '項目'],
                ['inLoop', 'ループの中'],
            ],
            { if: { hasRows: true } },
        ),
        components: card('${u.name}', 'LWC', ['componentWireframe'], {
            for: { as: 'u', in: scope(['lwc']) },
        }),
        componentWireframe: el('LwcWireframe', { component: null }, [], {
            data: { provider: 'lwc.wireframe', args: { components: ['${u.name}'] } },
        }),
        flows: card('${u.name}', 'Flow', ['flowDiagram'], {
            for: { as: 'u', in: scope(['flow']) },
        }),
        flowDiagram: el('FlowDiagram', { flow: null }, [], {
            data: { provider: 'flow.diagram', args: { flows: ['${u.name}'] } },
        }),
        pages: card('${u.name}', 'Lightning ページ', ['flexiPage'], {
            for: { as: 'u', in: scope(['flexiPage']) },
        }),
        flexiPage: el('FlexiPageView', {}, [], {
            data: { provider: 'flexiPage.detail', args: { flexiPages: ['${u.name}'] } },
        }),
        layouts: card('${u.name}', 'ページレイアウト', ['layout'], {
            for: { as: 'u', in: scope(['layout']) },
        }),
        layout: el('LayoutView', {}, [], {
            data: { provider: 'layout.detail', args: { layouts: ['${u.name}'] } },
        }),
    };
    section(
        elements,
        'scope',
        '機能の範囲',
        { provider: 'feature.scope', args: { targets: ['object:${o.object}'] } },
        [
            ['unitType', '種類'],
            ['name', '名前'],
            ['relation', '起点との関係'],
            ['depth', '段数'],
            ['filePath', 'ファイル'],
        ],
    );
    return documentOf('機能のまとまり', elements);
};
