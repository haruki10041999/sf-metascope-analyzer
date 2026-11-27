import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';

// 文字列を経由するメタデータ参照 (semantic/namedReferences.ts。docs/plan.md 10 章 P4 段 2)。
// 名前の文字列は、リテラルか、値の解析ですべて確定した変数・連結のときだけ参照にする

const refsOf = async (body: string) => {
    const source = `public class C { void m(String unknownName) { ${body} } }`;
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name: 'C',
        filePath: 'C.cls',
        source: { fileName: 'C.cls', source },
    });
    assert.deepEqual(unit.resolvedError, []);
    return getApexDependencies(unit).references.map(
        (r) => `${r.kind} ${r.refType}:${r.target} (${r.via})`,
    );
};

describe('文字列を経由するメタデータ参照', () => {
    it('変数・連結の文字列も、値の解析で確定すれば参照にする', async () => {
        const refs = await refsOf(
            [
                "String cls = 'MyHandler';",
                'Type t = Type.forName(cls);',
                "String labelName = 'Greet' + 'ing';",
                "String text = Label.get('', labelName);",
                "String perm = 'CanEdit';",
                'Boolean ok = FeatureManagement.checkPermission(perm);',
            ].join(' '),
        );
        assert.ok(refs.includes('uses apexType:MyHandler (Type.forName)'));
        assert.ok(refs.includes('uses customLabel:Greeting (Label.get)'));
        assert.ok(refs.includes('uses customPermission:CanEdit (FeatureManagement)'));
    });

    it('一部でも分からない文字列 (引数など) は参照にしない', async () => {
        const refs = await refsOf(
            "Type t = Type.forName(unknownName); String labelName = 'X' + unknownName; String text = Label.get('', labelName);",
        );
        assert.ok(!refs.some((r) => r.includes('(Type.forName)')));
        assert.ok(!refs.some((r) => r.includes('(Label.get)')));
    });

    it('Schema.getGlobalDescribe().get の名前はオブジェクト、決まったオブジェクトの get / put は項目の読み・書き', async () => {
        const refs = await refsOf(
            [
                "Schema.SObjectType t = Schema.getGlobalDescribe().get('Invoice__c');",
                'Account a = new Account();',
                "Object r = a.get('Rating');",
                "String f = 'Industry';",
                "a.put(f, 'Tech');",
                'SObject s = a;',
                "Object n = s.get('Name');",
            ].join(' '),
        );
        assert.ok(refs.includes('uses object:Invoice__c (Schema.getGlobalDescribe)'));
        assert.ok(refs.includes('reads field:Account.Rating (SObject.get)'));
        assert.ok(refs.includes('writes field:Account.Industry (SObject.put)'));
        // 汎用の SObject は、どのオブジェクトか分からないので取らない
        assert.ok(!refs.some((r) => r.includes('.Name (SObject.get)')));
    });
});
