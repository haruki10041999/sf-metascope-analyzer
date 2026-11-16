import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApexPageParser } from '../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import { makeFormulaDiff } from '../../src/analyzer/processor/commons/diff/formula';
import type { GumTreeDiff } from '../../src/analyzer/processor/commons/diff/gumtree';
import { makeMarkupBodyDiff } from '../../src/analyzer/processor/Metadata/diff/markup';
import type { ApexPageJson, CustomObjectJson, FxJson } from '../../src/analyzer/types';

// 数式・マークアップの木の差分 (GumTree。docs/json-redesign-plan.md の段階 M4・M6 の続き)

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

const formulaOf = (formula: string) =>
    (
        MetadataParser.parseObjectSource('Invoice__c', [
            {
                fileName: 'Invoice__c.object-meta.xml',
                filePath: 'Invoice__c/Invoice__c.object-meta.xml',
                source: `<CustomObject ${NS}><label>Invoice</label></CustomObject>`,
            },
            {
                fileName: 'F__c.field-meta.xml',
                filePath: 'Invoice__c/fields/F__c.field-meta.xml',
                source: `<CustomField ${NS}><fullName>F__c</fullName><formula>${formula}</formula><type>Checkbox</type></CustomField>`,
            },
        ]).result.base as CustomObjectJson
    ).fields![0]!.formula as FxJson;

/** 差分の木の中の、changed / added / removed のノード (ラベルと状態) */
const changesOf = (diffs: GumTreeDiff[]): string[] =>
    diffs.flatMap((diff) => [
        ...(diff.status === 'unchanged' ? [] : [`${diff.status} ${diff.label}`]),
        ...('children' in diff && diff.children ? changesOf(diff.children as GumTreeDiff[]) : []),
    ]);

describe('数式・マークアップの木の差分 (GumTree)', () => {
    it('数式は木で比べ、変わった名前・値だけを出す', () => {
        const before = formulaOf('AND(ISPICKVAL(Status__c, &apos;Paid&apos;), Amount__c &gt; 10)');
        const after = formulaOf('AND(ISPICKVAL(Status__c, &apos;Paid&apos;), Amount__c &gt; 20)');
        const diff = makeFormulaDiff(before, after);
        assert.ok('tree' in diff);
        const changes = changesOf(diff.tree);
        assert.ok(changes.includes('changed fxNumber'), changes.join(', '));
        // 変わっていない ISPICKVAL は changed にしない
        assert.ok(!changes.includes('changed fxCall:ISPICKVAL'), changes.join(', '));
        // 同じ数式は unchanged
        assert.equal(
            makeFormulaDiff(
                before,
                formulaOf('AND(ISPICKVAL(Status__c, &apos;Paid&apos;), Amount__c &gt; 10)'),
            ).status,
            'unchanged',
        );
    });

    it('マークアップは要素を対応付け、属性の違いを属性名で出す (包んでも対応付ける)', () => {
        const pageOf = (markup: string) =>
            (
                ApexPageParser.parseSource(
                    'pages/P.page-meta.xml',
                    `<ApexPage ${NS}><apiVersion>61.0</apiVersion><label>P</label></ApexPage>`,
                    { extras: [{ fileName: 'P.page', filePath: 'pages/P.page', source: markup }] },
                ).result.base as ApexPageJson
            ).markup!.body;
        // 属性だけが変わったら、要素は changed で、属性名ごとの違いを出す
        const attribute = makeMarkupBodyDiff(
            pageOf('<apex:page><apex:outputField value="{!Invoice__c.Amount__c}"/></apex:page>'),
            pageOf('<apex:page><apex:outputField value="{!Invoice__c.Total__c}"/></apex:page>'),
        );
        assert.equal(attribute[0]!.status, 'changed');
        assert.deepEqual((attribute[0] as { fields?: Record<string, unknown> }).fields?.value, {
            status: 'changed',
            before: '{!Invoice__c.Amount__c}',
            after: '{!Invoice__c.Total__c}',
        });
        // div で包んでも、中の要素 (子を持つもの) は対応付ける
        const wrapped = makeMarkupBodyDiff(
            pageOf('<apex:page><apex:pageBlock><p>A</p><p>B</p></apex:pageBlock></apex:page>'),
            pageOf(
                '<apex:page><div><apex:pageBlock><p>A</p><p>B</p></apex:pageBlock></div></apex:page>',
            ),
        );
        const changes = changesOf(wrapped);
        assert.ok(changes.includes('added element:div'), changes.join(', '));
        assert.ok(!changes.includes('removed element:apex:pageBlock'), changes.join(', '));
    });
});
