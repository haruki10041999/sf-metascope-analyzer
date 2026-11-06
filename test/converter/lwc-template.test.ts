import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { LwcParser, parseTemplate } from '../../src/analyzer/parser/Lwc';
import type {
    LwcElementJson,
    LwcForEachJson,
    LwcIfJson,
    LwcTemplateJson,
    LwcTemplateNodeJson,
    LwcTextJson,
} from '../../src/analyzer/types';

// LWC のテンプレート (HTML) の JSON と検証 (docs/lwc-json-reference.md)

const BUNDLES = 'docs/examples/lwc/samples/bundles/force-app/main/default/lwc';

const templateOf = (source: string) =>
    parseTemplate('x/x.html', `<template>${source}</template>`).template as LwcTemplateJson;

/** 前順にすべてのノード (分岐・繰り返しの中も) */
const walk = (nodes: LwcTemplateNodeJson[], out: LwcTemplateNodeJson[] = []) => {
    for (const node of nodes) {
        out.push(node);
        if (node.kind === 'lwcIf') node.branches.forEach((b) => walk(b.children, out));
        else if (node.kind !== 'lwcText') walk(node.children, out);
    }
    return out;
};
const elements = (template: LwcTemplateJson) =>
    walk(template.children).filter((n): n is LwcElementJson => n.kind === 'lwcElement');

describe('LWC のテンプレート (JSON)', () => {
    it('accountList.html: 要素・コンポーネント・分岐・繰り返しを JSON にする', async () => {
        const source = (await readFile(`${BUNDLES}/accountList/accountList.html`, 'utf8')).replace(
            /\r\n/g,
            '\n',
        );
        const result = parseTemplate('accountList/accountList.html', source, {
            name: 'accountList',
        });
        assert.deepEqual(result.resolvedError, []);
        const template = result.template as LwcTemplateJson;
        assert.equal(template.kind, 'lwcTemplate');

        const card = template.children[0] as LwcElementJson;
        assert.equal(card.tag, 'lightning-card');
        assert.deepEqual(card.component, {
            namespace: 'lightning',
            name: 'card',
            module: 'lightning/card',
            source: 'lightning',
        });
        assert.deepEqual(
            card.attributes.map((a) => [a.name, a.propertyName, a.value.type]),
            [
                ['title', 'title', 'expression'],
                ['icon-name', 'iconName', 'static'],
            ],
        );

        // lwc:if / lwc:elseif / lwc:else は 1 つの分岐の並び。<template> は消え、その子が分岐の子になる
        const ifs = card.children.filter((n): n is LwcIfJson => n.kind === 'lwcIf');
        assert.deepEqual(
            ifs[0]!.branches.map((b) => b.directive),
            ['lwc:if', 'lwc:elseif', 'lwc:else'],
        );

        // 子コンポーネント (同じ名前空間) は local。ループの名前 (row) の参照は local な式
        const row = elements(template).find((e) => e.tag === 'c-account-row')!;
        assert.deepEqual(row.component, {
            namespace: 'c',
            name: 'accountRow',
            module: 'c/accountRow',
            source: 'local',
        });
        const recordId = row.attributes.find((a) => a.name === 'record-id')!;
        assert.equal(recordId.propertyName, 'recordId');
        assert.deepEqual(recordId.value, {
            type: 'expression',
            expression: { text: 'row.id', path: ['row', 'id'], local: true },
        });
        assert.deepEqual(
            row.events.map((e) => [e.event, e.handler]),
            [
                [
                    'select',
                    {
                        type: 'expression',
                        expression: { text: 'handleSelect', path: ['handleSelect'], local: false },
                    },
                ],
            ],
        );

        // for:each と iterator:*
        const loops = walk(template.children).filter(
            (n): n is LwcForEachJson => n.kind === 'lwcForEach',
        );
        assert.deepEqual(
            loops.map((l) => [l.iteratorType, l.item, l.index, l.iteratorName]),
            [
                ['for:each', 'row', 'index', undefined],
                ['iterator', undefined, undefined, 'it'],
            ],
        );

        // ディレクティブ (制御以外) と slot
        const table = elements(template).find((e) => e.tag === 'table')!;
        assert.deepEqual(
            table.directives.map((d) => [d.name, d.value]),
            [['lwc:ref', { type: 'static', value: 'table' }]],
        );
        const slot = elements(template).find((e) => e.elementType === 'slot')!;
        assert.equal(slot.slotName, 'footer');

        // テキストの式。静的な文言も入れる
        const texts = walk(template.children).filter((n): n is LwcTextJson => n.kind === 'lwcText');
        assert.ok(texts.some((t) => t.text === '合計: {totalAmount}'));
        assert.ok(texts.some((t) => t.text === '取引先がありません' && t.expressions.length === 0));
    });

    it('要素に付けた lwc:if は、その要素を分岐の子にする。for:each と lwc:if が同じ要素なら繰り返しの中で分岐する', () => {
        const template = templateOf(
            '<span lwc:if={a}>x</span><li for:each={rows} for:item="r" key={r.id} lwc:if={r.visible}>{r.name}</li>',
        );
        const [ifNode, loop] = template.children as [LwcIfJson, LwcForEachJson];
        assert.equal(ifNode.kind, 'lwcIf');
        assert.equal((ifNode.branches[0]!.children[0] as LwcElementJson).tag, 'span');
        assert.equal(loop.kind, 'lwcForEach');
        const inner = loop.children[0] as LwcIfJson;
        assert.equal(inner.kind, 'lwcIf');
        assert.deepEqual(inner.branches[0]!.condition, {
            type: 'expression',
            expression: { text: 'r.visible', path: ['r', 'visible'], local: true },
        });
        const li = inner.branches[0]!.children[0] as LwcElementJson;
        assert.deepEqual(
            li.directives.map((d) => d.name),
            ['key'],
        );
    });

    it('if:true は 1 つずつの分岐 (非推奨でも通す)。値なし・引用符付きの値の種類', () => {
        const template = templateOf(
            '<p if:true={a}>1</p><p if:false={a}>2</p><input disabled title="{t}">',
        );
        assert.deepEqual(
            template.children.map((n) => (n.kind === 'lwcIf' ? n.branches[0]!.directive : n.kind)),
            ['if:true', 'if:false', 'lwcElement'],
        );
        const input = template.children[2] as LwcElementJson;
        assert.deepEqual(
            input.attributes.map((a) => [a.name, a.value.type]),
            [
                ['disabled', 'boolean'],
                ['title', 'static'],
            ],
        );
    });

    it('タグの種類: 動的コンポーネント・lwc:external・ほかの名前空間', () => {
        const template = templateOf(
            '<lwc:component lwc:is={ctor}></lwc:component><my-widget lwc:external></my-widget><acme-chart></acme-chart>',
        );
        assert.deepEqual(
            elements(template).map((e) => [e.elementType, e.component?.source]),
            [
                ['dynamic', undefined],
                ['external', undefined],
                ['component', 'package'],
            ],
        );
    });

    it('コンポーネントのタグの class / style / slot / data-* はプロパティにしない', () => {
        const [element] = elements(
            templateOf('<c-foo class="a" data-id="1" tabindex="0" aria-label="x"></c-foo>'),
        );
        assert.deepEqual(
            element!.attributes.map((a) => [a.name, a.propertyName]),
            [
                ['class', undefined],
                ['data-id', undefined],
                ['tabindex', 'tabIndex'],
                ['aria-label', 'ariaLabel'],
            ],
        );
    });

    it('空白の書き方が違っても objectKey は同じ', () => {
        const a = templateOf('<p class="x">a  b</p>');
        const b = templateOf('\n    <p   class="x">\n a b \n</p>\n');
        assert.equal(a.children[0]!.sourceKeys.objectKey, b.children[0]!.sourceKeys.objectKey);
    });
});

describe('LWC のテンプレート (検証)', () => {
    it('ルートが <template> でなければ ErrorJson。診断は phase syntax', () => {
        const result = parseTemplate('x/x.html', '<div>{a}</div>');
        assert.equal(result.template.kind, 'error');
        assert.deepEqual(
            result.resolvedError.map((e) => [e.phase, e.code]),
            [['syntax', 'LWC1079']],
        );
    });

    it('HTML の構文エラーは LWC1058 (parse5 のコードを contextType に持つ)。JSON は作る', () => {
        const result = parseTemplate('x/x.html', '<template><c-foo/></template>');
        assert.equal(result.template.kind, 'lwcTemplate');
        assert.deepEqual(result.resolvedError[0]!.phase, 'syntax');
        assert.deepEqual(result.resolvedError[0]!.code, 'LWC1058');
        assert.equal(
            result.resolvedError[0]!.contextType,
            'non-void-html-element-start-tag-with-trailing-solidus',
        );
    });

    it('LWC の仕様違反は複数件そろって出る。警告は warning', () => {
        const result = parseTemplate(
            'x/x.html',
            '<template><p lwc:else></p><c-a onClick={h}></c-a><p key={k}>x</p></template>',
        );
        assert.deepEqual(
            result.resolvedError.map((e) => [e.phase, e.code, e.level]),
            [
                ['lwc', 'LWC1165', 'error'],
                ['lwc', 'LWC1055', 'error'],
                ['lwc', 'LWC1149', 'warning'],
            ],
        );
    });

    it('lwc:component と lwc:on は違反にしない', () => {
        const result = parseTemplate(
            'x/x.html',
            '<template><lwc:component lwc:is={ctor}></lwc:component><div lwc:on={handlers}></div></template>',
        );
        assert.deepEqual(result.resolvedError, []);
    });

    it('バンドルのテンプレートの診断は、バンドルの resolvedError に入る', async () => {
        const result = await LwcParser.parseLwcBundle(`${BUNDLES}/broken`);
        assert.deepEqual(
            result.resolvedError
                .filter((e) => e.filePath === 'broken/broken.html')
                .map((e) => e.code),
            ['LWC1166', 'LWC1055', 'TEMPLATE_UNKNOWN_HANDLER'],
        );
        if (result.dataType === 'lwcBundle') {
            assert.deepEqual(
                result.result.base.templates.map((t) => [t.fileName, t.main, t.template.kind]),
                [['broken.html', true, 'lwcTemplate']],
            );
        }
    });
});

describe('LWC のテンプレート (メタデータの参照)', () => {
    it('lightning-* のカタログでメタデータを参照する属性を metadataRefs にする', () => {
        const template = templateOf(`
<lightning-card icon-name="standard:account">
    <lightning-record-edit-form object-api-name="Account" record-type-id={rt}>
        <lightning-input-field field-name="Name"></lightning-input-field>
        <lightning-record-view-form object-api-name={objectApiName}>
            <lightning-output-field field-name="Industry"></lightning-output-field>
        </lightning-record-view-form>
    </lightning-record-edit-form>
    <lightning-flow flow-api-name="MyFlow"></lightning-flow>
    <c-account-row icon-name="x"></c-account-row>
</lightning-card>`);
        const refs = Object.fromEntries(
            elements(template)
                .filter((e) => e.metadataRefs)
                .map((e) => [e.tag, e.metadataRefs!.map((r) => [r.attribute, r.refType, r.value])]),
        );
        assert.deepEqual(refs, {
            'lightning-card': [['icon-name', 'icon', 'standard:account']],
            'lightning-record-edit-form': [
                ['object-api-name', 'object', 'Account'],
                ['record-type-id', 'recordType', undefined],
            ],
            // 祖先のレコードフォームのオブジェクトと合わせる
            'lightning-input-field': [['field-name', 'field', 'Account.Name']],
            'lightning-record-view-form': [['object-api-name', 'object', undefined]],
            // 祖先のフォームのオブジェクトが式なら、項目名と objectExpression
            'lightning-output-field': [['field-name', 'field', 'Industry']],
            'lightning-flow': [['flow-api-name', 'flow', 'MyFlow']],
        });
        const output = elements(template).find((e) => e.tag === 'lightning-output-field')!;
        assert.equal(output.metadataRefs![0]!.objectExpression?.text, 'objectApiName');
    });
});
