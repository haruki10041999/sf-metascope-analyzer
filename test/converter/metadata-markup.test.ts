import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApexPageParser, AuraParser, FlowParser } from '../../src/analyzer/parser/Metadata';
import { markupTagsOf, mergeTextsOf } from '../../src/analyzer/processor/Metadata/markup';
import {
    type ApexPageJson,
    type AuraBundleJson,
    type FlowJson,
    type FxTemplateJson,
    type MarkupElementJson,
    type MarkupTextJson,
    formulaTextOf,
    parseFormulaSyntax,
    templateTextOf,
} from '../../src/analyzer/types';
import { p1Shape } from './lwcShape';

// マークアップの木と、差し込みを含む文字列のテンプレート (docs/json-redesign-plan.md の段階 M6)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

/** sourceKeys を除いた形 */
const shape = (value: unknown): unknown =>
    Array.isArray(value)
        ? value.map(shape)
        : value && typeof value === 'object'
          ? Object.fromEntries(
                Object.entries(value)
                    .filter(([key]) => key !== 'sourceKeys')
                    .map(([key, child]) => [key, shape(child)]),
            )
          : value;

const PAGE = `<apex:page standardController="Invoice__c">
    <apex:outputField value="{!Invoice__c.Amount__c}"/>
    <p>合計 {!Invoice__c.Total__c} &amp; {!$Label.Thanks}</p>
</apex:page>`;

const pageOf = (markup: string) =>
    ApexPageParser.parseSource(
        'pages/InvoicePrint.page-meta.xml',
        `<ApexPage ${NS}><apiVersion>61.0</apiVersion><label>InvoicePrint</label></ApexPage>`,
        {
            extras: [
                {
                    fileName: 'InvoicePrint.page',
                    filePath: 'pages/InvoicePrint.page',
                    source: markup,
                },
            ],
        },
    );

describe('マークアップの木とテンプレート (段階 M6)', () => {
    it('Visualforce の本体を要素とテキストの木にし、差し込みを含む値は fxTemplate にする', () => {
        const result = pageOf(PAGE);
        const page = result.result.base as ApexPageJson;
        const [field, p] = page.markup!.body as MarkupElementJson[];
        assert.equal(field!.tag, 'apex:outputField');
        assert.deepEqual(p1Shape(shape(field!.attributes[0])), {
            name: 'value',
            value: {
                kind: 'fxTemplate',
                parts: [
                    {
                        kind: 'fxMerge',
                        expression: { kind: 'fxName', path: ['Invoice__c', 'Amount__c'] },
                    },
                ],
            },
        });
        const text = p!.children[0] as MarkupTextJson;
        assert.equal(text.kind, 'markupText');
        assert.equal(templateTextOf(text.text), '合計 {!Invoice__c.Total__c} & {!$Label.Thanks}');
        // 位置: 差し込みの名前は .page のファイルの中の範囲 (実体参照も戻した位置)
        const merge = (text.text as FxTemplateJson).parts[1] as {
            expression: { sourceKeys: { objectKey: string } };
        };
        const context = result.result.sourceObject.find(
            (o) => o.objectKey === merge.expression.sourceKeys.objectKey,
        );
        assert.equal(context?.context, 'Invoice__c.Total__c');
        assert.deepEqual(result.resolvedError, []);
        // 使っている部品・差し込みは木から出す
        assert.deepEqual(markupTagsOf(page.markup!.body), ['apex:outputField']);
        assert.deepEqual(mergeTextsOf(page.markup!.body), [
            '$Label.Thanks',
            'Invoice__c.Amount__c',
            'Invoice__c.Total__c',
        ]);
    });

    it('読めない差し込みは文字列のまま parts に残し、resolvedError に FORMULA_SYNTAX を出す', () => {
        const result = pageOf('<apex:page><p>{!a +}</p></apex:page>');
        const page = result.result.base as ApexPageJson;
        const text = (page.markup!.body[0] as MarkupElementJson).children[0] as MarkupTextJson;
        assert.equal(text.text, '{!a +}');
        assert.deepEqual(
            result.resolvedError.map((e) => e.code),
            ['FORMULA_SYNTAX'],
        );
    });

    it('Aura の式: 三項演算子と {#...} (一度だけ評価)', () => {
        assert.equal(formulaTextOf(parseFormulaSyntax("v.show ? 'a' : 'b'")), "v.show ? 'a' : 'b'");
        const result = AuraParser.parseSource(
            'aura/card/card.cmp',
            `<aura:component>
                <aura:attribute name="show" type="Boolean"/>
                <lightning:card title="{#v.title}">{!v.show ? v.a : v.b}</lightning:card>
            </aura:component>`,
            { name: 'card' },
        );
        const card = result.result.base as AuraBundleJson;
        // 宣言は attributes に出し、本体の木には持たない
        assert.deepEqual(markupTagsOf(card.body), ['lightning:card']);
        const element = card.body[0] as MarkupElementJson;
        const title = element.attributes[0]!.value as FxTemplateJson;
        assert.equal((title.parts[0] as { once?: boolean }).once, true);
        const body = (element.children[0] as MarkupTextJson).text as FxTemplateJson;
        assert.equal(
            (body.parts[0] as { expression: { kind: string } }).expression.kind,
            'fxConditional',
        );
        assert.deepEqual(result.resolvedError, []);
    });

    it('Flow のテキストテンプレートの本文も fxTemplate にする (値の木の文字列にしない)', () => {
        const flow = FlowParser.parseSource(
            'flows/F.flow-meta.xml',
            `<Flow ${NS}>
                <label>F</label>
                <textTemplates><name>Body</name><isViewedAsPlainText>true</isViewedAsPlainText>
                    <text>Hello {!$Record.Name}</text></textTemplates>
            </Flow>`,
        );
        const json = flow.result.base as FlowJson;
        const resource = json.resources![0]!;
        assert.equal((resource.text as FxTemplateJson).kind, 'fxTemplate');
        assert.equal(templateTextOf(resource.text!), 'Hello {!$Record.Name}');
        assert.equal(resource.properties?.text, undefined);
    });
});
