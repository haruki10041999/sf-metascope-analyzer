import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FlowParser } from '../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../src/analyzer/parser/Metadata/parser';
import { formulaReferencesOf } from '../../src/analyzer/processor/dependency/formula';
import type { UnitReference } from '../../src/analyzer/processor/dependency/types';
import { getUnitDependencies } from '../../src/analyzer/processor/dependency/units';
import {
    type CustomObjectJson,
    type FlowJson,
    type FxJson,
    formulaTextOf,
    parseFormulaSyntax,
} from '../../src/analyzer/types';

// 数式の JSON (docs/json-redesign-plan.md の段階 M4。docs/metadata-json-review.md 5.1)

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

const objectOf = (files: Record<string, string>) =>
    MetadataParser.parseObjectSource(
        'Invoice__c',
        Object.entries(files).map(([relative, source]) => ({
            fileName: relative.split('/').pop()!,
            filePath: `Invoice__c/${relative}`,
            source,
        })),
    );

const FIELD = (formula: string) => `<?xml version="1.0" encoding="UTF-8"?>
<CustomField ${NS}>
    <fullName>Is_Overdue__c</fullName>
    <formula>${formula}</formula>
    <type>Checkbox</type>
</CustomField>`;

describe('数式の JSON (段階 M4)', () => {
    it('関数・演算子・名前・リテラルを fx* の木にする', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': `<CustomObject ${NS}><label>Invoice</label></CustomObject>`,
            'fields/Is_Overdue__c.field-meta.xml': FIELD(
                'AND(NOT(ISPICKVAL(Status__c, &apos;Paid&apos;)), Due_Date__c &lt; TODAY())',
            ),
        });
        const object = result.result.base as CustomObjectJson;
        const formula = object.fields![0]!.formula as FxJson;
        assert.deepEqual(shape(formula), {
            kind: 'fxCall',
            name: 'AND',
            arg: [
                {
                    kind: 'fxCall',
                    name: 'NOT',
                    arg: [
                        {
                            kind: 'fxCall',
                            name: 'ISPICKVAL',
                            arg: [
                                { kind: 'fxName', path: ['Status__c'] },
                                { kind: 'fxString', value: 'Paid' },
                            ],
                        },
                    ],
                },
                {
                    kind: 'fxBinary',
                    left: { kind: 'fxName', path: ['Due_Date__c'] },
                    operator: '<',
                    right: { kind: 'fxCall', name: 'TODAY', arg: [] },
                },
            ],
        });
        assert.equal(
            formulaTextOf(formula),
            "AND(NOT(ISPICKVAL(Status__c, 'Paid')), Due_Date__c < TODAY())",
        );
        assert.deepEqual(result.resolvedError, []);
    });

    it('どのノードも位置を持ち、実体参照を含むソースの範囲を指す', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': `<CustomObject ${NS}><label>Invoice</label></CustomObject>`,
            'fields/Is_Overdue__c.field-meta.xml': FIELD('Amount__c &lt;= 0'),
        });
        const object = result.result.base as CustomObjectJson;
        const formula = object.fields![0]!.formula as FxJson & { left: FxJson; right: FxJson };
        const contextOf = (node: FxJson) =>
            result.result.sourceObject.find((o) => o.objectKey === node.sourceKeys.objectKey)
                ?.context;
        assert.equal(contextOf(formula), 'Amount__c &lt;= 0');
        assert.equal(contextOf(formula.left), 'Amount__c');
        assert.equal(contextOf(formula.right), '0');
    });

    it('読めない数式は文字列のまま持ち、resolvedError に FORMULA_SYNTAX を出す', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': `<CustomObject ${NS}><label>Invoice</label></CustomObject>`,
            'fields/Is_Overdue__c.field-meta.xml': FIELD('AND(Status__c, '),
        });
        const object = result.result.base as CustomObjectJson;
        assert.equal(object.fields![0]!.formula, 'AND(Status__c,');
        assert.deepEqual(
            result.resolvedError.map((e) => [e.code, e.contextType]),
            [['FORMULA_SYNTAX', 'formula']],
        );
    });

    it('差し込み・演算子の優先度・単項・括弧', () => {
        assert.deepEqual(shape(parseFormulaSyntax('{!$Record.Amount__c} > 50000')), {
            kind: 'fxBinary',
            start: 0,
            end: 28,
            left: {
                kind: 'fxMerge',
                start: 0,
                end: 20,
                expression: { kind: 'fxName', start: 2, end: 19, path: ['$Record', 'Amount__c'] },
            },
            operator: '>',
            right: { kind: 'fxNumber', start: 23, end: 28, value: '50000' },
        });
        assert.equal(
            formulaTextOf(parseFormulaSyntax('a || b && -c + d * e ^ 2')),
            'a || b && -c + d * e ^ 2',
        );
        const tree = parseFormulaSyntax('(a + b) * c') as unknown as { left: { kind: string } };
        assert.equal(tree.left.kind, 'fxParen');
        assert.equal(
            (parseFormulaSyntax('a || b && c') as unknown as { operator: string }).operator,
            '||',
        );
    });

    it('参照は名前のノードから取り、その位置を expression に持つ', () => {
        const result = objectOf({
            'Invoice__c.object-meta.xml': `<CustomObject ${NS}><label>Invoice</label></CustomObject>`,
            'fields/Is_Overdue__c.field-meta.xml': FIELD('Account__r.Name &amp; $Label.Greeting'),
        });
        const object = result.result.base as CustomObjectJson;
        const formula = object.fields![0]!.formula as FxJson & { left: FxJson };
        const refs = formulaReferencesOf(formula, 'Invoice__c');
        assert.deepEqual(
            refs.map((r) => [r.refType, 'name' in r ? r.name : r.field]),
            [
                ['field', 'Account__c'],
                ['customLabel', 'Greeting'],
            ],
        );
        assert.deepEqual(refs[0]!.expression, formula.left.sourceKeys);
        const unit = getUnitDependencies('object', result).references.filter(
            (r: UnitReference) => r.via === 'formula',
        );
        assert.deepEqual(unit[0]!.from.expression, formula.left.sourceKeys);
    });

    it('Flow の数式の資源と起動の条件も数式の JSON にする (値の木の文字列にしない)', () => {
        const flow = FlowParser.parseSource(
            'flows/F.flow-meta.xml',
            `<Flow ${NS}>
                <formulas><name>IsLarge</name><dataType>Boolean</dataType>
                    <expression>{!$Record.Amount__c} &gt; 50000</expression></formulas>
                <label>F</label>
                <start><object>Invoice__c</object><triggerType>RecordAfterSave</triggerType>
                    <filterFormula>ISCHANGED({!$Record.Amount__c})</filterFormula></start>
            </Flow>`,
        );
        const json = flow.result.base as FlowJson;
        const resource = json.resources![0]!;
        assert.equal((resource.expression as FxJson).kind, 'fxBinary');
        assert.equal(resource.properties?.expression, undefined);
        assert.equal((json.start!.filterFormula as FxJson).kind, 'fxCall');
        assert.equal(json.start!.properties?.filterFormula, undefined);
    });
});
