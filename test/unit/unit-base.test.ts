import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isUnitOfType, unitBaseOf } from '../../src/analyzer/parser/unitBase';

// 解析結果の中身の型を、種類から引く (src/analyzer/parser/unitBase.ts。docs/plan.md 10 章 P2)

describe('解析結果の中身 (unitBaseOf)', () => {
    const flow = { dataType: 'flow', result: { base: { kind: 'flow', name: 'F' } } };
    const broken = { dataType: 'error', result: { base: null } };

    it('種類が合えば中身を返し、違えば・読めなかった解析結果なら undefined', () => {
        assert.equal(unitBaseOf(flow, 'flow')?.name, 'F');
        assert.equal(unitBaseOf(flow, 'layout'), undefined);
        assert.equal(unitBaseOf(broken, 'flow'), undefined);
        assert.ok(isUnitOfType(flow, 'flow'));
        assert.ok(!isUnitOfType(broken, 'flow'));
    });
});
