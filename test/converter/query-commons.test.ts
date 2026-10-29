import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeConvertType } from '../../src/analyzer/types/apex/commons';
import { LogicalExpressionType } from '../../src/analyzer/types/apex/converter';
import {
    isLogicalConditionJson,
    makeLogicalConditionJson,
} from '../../src/analyzer/types/apex/query/commons';

const sourceInfo = {
    context: 'query.apex',
    start: { offset: 0, line: 1, column: 0 },
    end: { offset: 1, line: 1, column: 1 },
};

describe('makeLogicalConditionJson', () => {
    for (const operator of ['AND', 'OR', 'NOT', null] as const) {
        it(`preserves ${operator} and omits a null operator`, async () => {
            const { result } = await makeConvertType<LogicalExpressionType>({
                type: 'logicalExpression',
                sourceInfo,
                operator,
                value: [
                    {
                        type: 'conditionalExpression',
                        sourceInfo,
                        value: {
                            type: 'logicalExpression',
                            sourceInfo,
                            operator: null,
                            value: [],
                        },
                    },
                ],
            });

            const json = makeLogicalConditionJson(result);

            // 論理条件は非境界ノード（キーを持たない）。単一条件だけが境界ノード
            assert.ok(isLogicalConditionJson(json));
            assert.equal(Object.hasOwn(json, 'operator'), operator !== null);
            assert.equal(json.operator, operator ?? undefined);
            assert.deepEqual(json.condition, [{ condition: [] }]);
            assert.equal(Object.hasOwn(json, 'sourceKeys'), false);
        });
    }
});
