import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    makeFromDiff,
    makeOrderByDiff,
    makeSelectEntriesDiff,
    makeSoqlDiff,
    makeSoqlFunctionDiff,
    makeSoslDiff,
} from '../../../src/analyzer/processor/Apex/diff/query';
import { makeValueDiff } from '../../../src/analyzer/processor/commons/diff/commons';
import type {
    ErrorJson,
    FieldOrderJson,
    SelectEntryJson,
    SoqlJson,
    SoqlFunctionJson,
    SoslJson,
} from '../../../src/analyzer/types';

const keys = (objectKey: string) => ({ objectKey, sourceKey: `${objectKey}-source` });

describe('SOQL and SOSL diff', () => {
    it('uses objectKey for nested nodes and ignores source position changes', () => {
        const before = {
            expression: {
                kind: 'expression',
                sourceKeys: { objectKey: 'same-expression', sourceKey: 'before' },
            },
        };
        const after = {
            expression: {
                kind: 'expression',
                sourceKeys: { objectKey: 'same-expression', sourceKey: 'after' },
            },
        };

        assert.deepEqual(makeValueDiff(before, after), {
            status: 'unchanged',
            value: before,
        });
    });

    it('compares SELECT entries as a set', () => {
        const account: SelectEntryJson = {
            kind: 'selectEntry',
            sourceKeys: keys('account'),
            type: 'field',
            field: ['Account'],
        };
        const name: SelectEntryJson = {
            kind: 'selectEntry',
            sourceKeys: keys('name'),
            type: 'field',
            field: ['Name'],
        };

        assert.deepEqual(
            makeSelectEntriesDiff([account, name], [name, account]).map((item) => item.status),
            ['unchanged', 'unchanged'],
        );
    });

    it('pairs SELECT entries with the same expression to expose alias changes', () => {
        const before: SelectEntryJson = {
            kind: 'selectEntry',
            sourceKeys: keys('select-before'),
            type: 'field',
            field: ['Name'],
            alias: 'oldName',
        };
        const after: SelectEntryJson = {
            ...before,
            sourceKeys: keys('select-after'),
            alias: 'newName',
        };

        const [diff] = makeSelectEntriesDiff([before], [after]);
        assert.equal(diff?.status, 'changed');
        if (diff?.status === 'changed' && 'fields' in diff) {
            assert.deepEqual(diff.fields.alias, {
                status: 'changed',
                before: 'oldName',
                after: 'newName',
            });
        } else {
            assert.fail('Expected a field-level alias diff');
        }
    });

    it('compares SOQL date-function arguments by field and timezone flag', () => {
        const before: SoqlFunctionJson = {
            type: 'soqlFunction',
            func: 'DAY_ONLY',
            arg: { name: ['CreatedDate'], isConvertTimeZone: false },
        };
        const after: SoqlFunctionJson = {
            type: 'soqlFunction',
            func: 'DAY_ONLY',
            arg: { name: ['CreatedDate'], isConvertTimeZone: true },
        };

        assert.deepEqual(makeSoqlFunctionDiff(before, after).arg, {
            status: 'changed',
            fields: {
                type: 'dateFieldName',
                value: {
                    name: { status: 'unchanged', value: ['CreatedDate'] },
                    isConvertTimeZone: { status: 'changed', before: false, after: true },
                },
            },
        });
    });

    it('compares FROM entries as an ordered sequence', () => {
        const before = {
            field: [
                { kind: 'fromField' as const, sourceKeys: keys('account'), field: ['Account'] },
                { kind: 'fromField' as const, sourceKeys: keys('contact'), field: ['Contact'] },
            ],
        };
        const after = { field: [...before.field].reverse() };

        const diff = makeFromDiff(before, after);
        if (Array.isArray(diff)) {
            assert.deepEqual(
                diff.map((item) => item.status),
                ['moved', 'unchanged'],
            );
        } else {
            assert.fail('Expected a field-level FROM diff');
        }
    });

    it('compares ORDER BY as an ordered sequence', () => {
        const first: FieldOrderJson = {
            kind: 'orderField',
            sourceKeys: keys('first'),
            type: 'field',
            field: ['Name'],
        };
        const second: FieldOrderJson = {
            kind: 'orderField',
            sourceKeys: keys('second'),
            type: 'field',
            field: ['CreatedDate'],
        };
        const before = { orderBy: [first, second] };
        const after = { orderBy: [second, first] };

        assert.deepEqual(
            (makeOrderByDiff(before, after) as { orderBy: { status: string }[] }).orderBy.map(
                (item) => item.status,
            ),
            ['moved', 'unchanged'],
        );
    });

    it('compares SOQL clauses and reports an added optional clause', () => {
        const before: SoqlJson = {
            kind: 'soql',
            sourceKeys: keys('query-before'),
            select: { field: [] },
            from: { field: [] },
        };
        const after: SoqlJson = {
            ...before,
            sourceKeys: keys('query-after'),
            where: { condition: { condition: [], operator: 'AND' } },
        };

        const diff = makeSoqlDiff(before, after);
        assert.equal(diff.status, 'changed');
        if (diff.status === 'changed' && 'fields' in diff) {
            assert.deepEqual(diff.fields.where, {
                status: 'added',
                value: after.where,
            });
        } else {
            assert.fail('Expected a field-level SOQL diff');
        }
    });

    it('compares SOSL query terms and retains errors as values', () => {
        const error: ErrorJson = {
            kind: 'error',
            sourceKeys: keys('find-error'),
            kindType: 'sosl',
        };
        const before: SoslJson = {
            kind: 'sosl',
            sourceKeys: keys('sosl-before'),
            find: 'Acme',
            fieldSpec: [],
        };
        const after: SoslJson = {
            ...before,
            sourceKeys: keys('sosl-after'),
            find: error,
        };

        const diff = makeSoslDiff(before, after);
        assert.equal(diff.status, 'changed');
        if (diff.status === 'changed' && 'fields' in diff) {
            // エラーの kind / sourceKeys は中身から分け、エラー側だけを持つ
            assert.deepEqual(diff.fields.find, {
                kind: { after: 'error' },
                sourceKeys: { after: error.sourceKeys },
                status: 'changed',
                before: 'Acme',
                after: { kindType: 'sosl' },
            });
        } else {
            assert.fail('Expected a field-level SOSL diff');
        }
    });
});
