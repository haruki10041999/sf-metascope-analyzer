import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isLogicalConditionJson } from '../../src/analyzer/types/apex/query/commons';

import { find, toJson, unitRules } from './helpers';

// WHERE の論理条件 (makeLogicalConditionJson)。IR v2 の木から作る (docs/ir-v2-integration.md)

const whereOf = async (where: string) => {
    const { json, irErrors } = await toJson(
        `List<Account> a = [SELECT Id FROM Account WHERE ${where}];`,
        unitRules.anonymous,
    );
    assert.deepEqual(irErrors, []);
    const [soql] = find(json, (n) => n.kind === 'soql');
    assert.ok(soql);
    return soql.where;
};

describe('makeLogicalConditionJson', () => {
    const cases = [
        ['AND', "Name = 'x' AND Id = null", 2],
        ['OR', "Name = 'x' OR Id = null", 2],
        ['NOT', "NOT Name = 'x'", 1],
        [null, "Name = 'x'", 1],
    ] as const;

    for (const [operator, where, count] of cases) {
        it(`preserves ${operator} and omits a null operator`, async () => {
            const json = await whereOf(where);
            const [logical] = find(json, (n) => isLogicalConditionJson(n));
            assert.ok(logical, where);

            // 論理条件は非境界ノード (キーを持たない)。単一条件だけが境界ノード
            assert.equal(Object.hasOwn(logical, 'operator'), operator !== null);
            assert.equal(logical.operator, operator ?? undefined);
            assert.equal(logical.condition.length, count);
            assert.ok(
                logical.condition.every((c: { kind: string }) => c.kind === 'singleCondition'),
            );
            assert.equal(Object.hasOwn(logical, 'sourceKeys'), false);
        });
    }
});
