import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { regenerateSourceObjects } from '../../src/analyzer/types/apex/commons';

import { find, toJson, unitRules } from './helpers';

// JSON 層の、省略できるところ・取り出し・SourceJson の再生成 (IR v2 の木から作る。docs/ir-v2-integration.md)。
// v1 の「エラーのノードを ErrorJson にする」テストは、v2 の木にエラーのノードがないのでなくした

const anonymous = async (source: string) => {
    const { json, irErrors } = await toJson(source, unitRules.anonymous);
    assert.deepEqual(irErrors, []);
    return json;
};

describe('JSON 層の形', () => {
    it('for の init / update が省略されていても変換できる', async () => {
        const [json] = find(await anonymous('for (; i < 1;) {}'), (n) => n.kind === 'for');

        assert.ok(json);
        assert.equal(json.condition.condition.left, 'i');
        assert.equal(Object.hasOwn(json.condition, 'initializer'), false);
        assert.equal(Object.hasOwn(json.condition, 'update'), false);
    });

    it('DISTANCE の引数は 2 つの位置と単位になる', async () => {
        const json = await anonymous(
            "List<Account> a = [SELECT Id FROM Account WHERE DISTANCE(Location__c, GEOLOCATION(1, 2), 'mi') < 20];",
        );
        const [distance] = find(json, (n) => n.func === 'DISTANCE');

        assert.ok(distance);
        assert.notEqual(distance.arg?.kind, 'error');
    });

    it('trigger 名と対象を持つ', async () => {
        const { json } = await toJson(
            'trigger OnlyName on Account (before insert) {}',
            unitRules.trigger,
        );

        assert.equal(json.name, 'OnlyName');
        assert.equal(json.object, 'Account');
    });

    it('SOSL の FIND は検索語だけを持つ', async () => {
        for (const [find_, term] of [
            ["FIND 'test'", 'test'],
            ["FIND 'it\\'s'", "it\\'s"],
        ] as const) {
            const json = await anonymous(
                `List<List<SObject>> r = [${find_} IN ALL FIELDS RETURNING Account];`,
            );
            const [sosl] = find(json, (n) => n.kind === 'sosl');
            assert.equal(sosl?.find, term);
        }
    });
});

describe('SourceJson の再生成', () => {
    it('深い入れ子でも各ノードを 1 回だけ辿る', () => {
        let node: any = { kind: 'leaf', sourceKeys: { objectKey: 'o0', sourceKey: 's0' } };
        for (let i = 1; i <= 40; i++) {
            node = {
                kind: 'n',
                sourceKeys: { objectKey: `o${i}`, sourceKey: `s${i}` },
                child: node,
            };
        }
        const sources = [{ objectKey: 'o0', context: 'x', source: [{ sourceKey: 's0' } as never] }];

        const started = Date.now();
        const result = regenerateSourceObjects(sources, node);

        assert.ok(Date.now() - started < 1000);
        assert.deepEqual(result, sources);
    });

    it('StructureJson の配列のキーも登録する', () => {
        const json: any = {
            kind: 'catchCondition',
            sourceKeys: {
                base: { objectKey: 'base', sourceKey: 'b' },
                exceptionType: [{ objectKey: 'type', sourceKey: 't1' }],
            },
        };
        const sources = [
            { objectKey: 'base', context: 'x', source: [{ sourceKey: 'b' } as never] },
            {
                objectKey: 'type',
                context: 'x',
                source: [{ sourceKey: 't1' } as never, { sourceKey: 't2' } as never],
            },
        ];

        const result = regenerateSourceObjects(sources, json);

        assert.deepEqual(
            result.map((o) => [o.objectKey, o.source.map((s: any) => s.sourceKey)]),
            [
                ['base', ['b']],
                ['type', ['t1']],
            ],
        );
    });
});
