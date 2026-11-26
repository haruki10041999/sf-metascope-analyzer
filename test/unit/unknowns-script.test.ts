import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { unknownsOfSource } from '../../docs/examples/analysis/scripts/unknowns';

// `unknown` を数えるスクリプト (docs/examples/analysis/scripts/unknowns.ts。docs/plan.md 10 章 P2) の分類

describe('unknown の数え直し (unknowns.ts)', () => {
    it('置いた場所と、そのままか型の中かで分ける', () => {
        const uses = unknownsOfSource(
            'x.ts',
            [
                'export const f = (a: unknown, b: Record<string, unknown>): unknown => a as unknown;',
                'type T = { p: unknown; q: unknown[] };',
                'type R = Record<string, unknown>;',
                'class C { field: unknown; m(x: unknown) {} }',
                'let v: unknown;',
                'g<unknown>();',
            ].join('\n'),
        );
        assert.deepEqual(
            uses.map((u) => `${u.line} ${u.kind} ${u.direct ? 'direct' : 'nested'}`).sort(),
            [
                '1 cast direct',
                '1 parameter direct',
                '1 parameter nested',
                '1 return direct',
                '2 property direct',
                '2 property nested',
                '3 typeAlias nested',
                '4 parameter direct',
                '4 property direct',
                '5 variable direct',
                '6 typeArgument nested',
            ],
        );
    });
});
