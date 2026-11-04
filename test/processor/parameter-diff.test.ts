import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ParametersDiff, makeParametersDiff } from '../../src/analyzer/processor/Apex/diff/param';
import type { ParameterJson, SourceJson } from '../../src/analyzer/types';

const makeParameter = (objectKey: string, sourceKey: string, variant: string): ParameterJson => ({
    kind: 'parameter',
    sourceKeys: { objectKey, sourceKey },
    variant,
    variantType: {
        kind: 'type',
        sourceKeys: { objectKey: `type_${variant}`, sourceKey: `type_${sourceKey}` },
        type: 'primitive',
        primitiveType: 'Integer',
    },
    modifier: {},
});

const makeSourceObjects = (
    parameters: { parameter: ParameterJson; start: number; end: number }[],
): SourceJson[] =>
    parameters.map(({ parameter, start, end }) => ({
        objectKey: parameter.sourceKeys.objectKey,
        context: '',
        source: [
            {
                sourceKey: parameter.sourceKeys.sourceKey,
                start: { offset: start, line: 1, column: start },
                end: { offset: end, line: 1, column: end },
            },
        ],
    }));

const summarize = (diffs: ParametersDiff[]) =>
    diffs.map((d) => [d.status, d.index, 'match' in d ? d.match : undefined]);

describe('parameters diff', () => {
    it('reports swapped parameters as moved', () => {
        const a = makeParameter('p_a', 'b0', 'a');
        const b = makeParameter('p_b', 'b1', 'b');
        const a2 = makeParameter('p_a', 'a1', 'a');
        const b2 = makeParameter('p_b', 'a0', 'b');

        assert.deepEqual(summarize(makeParametersDiff([a, b], [b2, a2])), [
            ['moved', { before: 0, after: 1 }, 'identical'],
            ['unchanged', { before: 1, after: 0 }, undefined],
        ]);
    });

    it('pairs changed parameters at the same position', () => {
        const a = makeParameter('p_a', 'b0', 'a');
        const b = makeParameter('p_b', 'b1', 'b');
        const a2 = makeParameter('p_a', 'a0', 'a');
        const x = makeParameter('p_x', 'a1', 'x');

        const diffs = makeParametersDiff([a, b], [a2, x], {
            before: makeSourceObjects([
                { parameter: a, start: 10, end: 19 },
                { parameter: b, start: 21, end: 30 },
            ]),
            after: makeSourceObjects([
                { parameter: a2, start: 10, end: 19 },
                { parameter: x, start: 21, end: 30 },
            ]),
        });

        assert.deepEqual(summarize(diffs), [
            ['unchanged', { before: 0, after: 0 }, undefined],
            ['changed', { before: 1, after: 1 }, 'nearest'],
        ]);
        const changed = diffs[1]!;
        assert.ok('fields' in changed);
        assert.deepEqual(changed.fields.variant, { status: 'changed', before: 'b', after: 'x' });
    });

    it('chooses the nearest one among parameters in the same gap', () => {
        const x = makeParameter('p_x', 'b0', 'x');
        const a1 = makeParameter('p_a', 'a0', 'a');
        const a2 = makeParameter('p_b', 'a1', 'b');

        const diffs = makeParametersDiff([x], [a1, a2], {
            before: makeSourceObjects([{ parameter: x, start: 21, end: 30 }]),
            after: makeSourceObjects([
                { parameter: a1, start: 10, end: 19 },
                { parameter: a2, start: 21, end: 30 },
            ]),
        });

        assert.deepEqual(summarize(diffs), [
            ['added', 0, undefined],
            ['changed', { before: 0, after: 1 }, 'nearest'],
        ]);
    });

    it('reports removed and added parameters', () => {
        const a = makeParameter('p_a', 'b0', 'a');
        const b = makeParameter('p_b', 'b1', 'b');
        const a2 = makeParameter('p_a', 'a0', 'a');

        assert.deepEqual(summarize(makeParametersDiff([a, b], [a2])), [
            ['unchanged', { before: 0, after: 0 }, undefined],
            ['removed', 1, undefined],
        ]);
        assert.deepEqual(summarize(makeParametersDiff([a2], [a, b])), [
            ['unchanged', { before: 0, after: 0 }, undefined],
            ['added', 1, undefined],
        ]);
    });
});
