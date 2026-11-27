import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { type Row, compareCells, nextSort, sortRows, tableToCsv } from '../../src/report/tableData';

// 表の並べ替え・CSV (src/report/tableData.ts。viewer の表と書き出しで共通。docs/plan-details.md B-1・B-3)

const rows: Row[] = [
    { name: 'b', count: 10, active: true },
    { name: 'a', count: 2, active: false },
    { name: 'c', count: null, active: true },
    { name: 'a2', count: 2 },
];

describe('表のデータ (tableData.ts)', () => {
    it('数は数で、文字は自然な順で比べ、空は最後', () => {
        assert.ok(compareCells(2, 10) < 0);
        assert.ok(compareCells('item2', 'item10') < 0);
        assert.ok(compareCells(null, 'a') > 0);
        assert.equal(compareCells(undefined, ''), 0);
    });

    it('並べ替え: 昇順・降順とも空は最後、同じ値は元の順', () => {
        const names = (sorted: Row[]) => sorted.map((r) => r.name);
        assert.deepEqual(names(sortRows(rows, { key: 'count', direction: 'asc' })), [
            'a',
            'a2',
            'b',
            'c',
        ]);
        assert.deepEqual(names(sortRows(rows, { key: 'count', direction: 'desc' })), [
            'b',
            'a',
            'a2',
            'c',
        ]);
        assert.deepEqual(names(sortRows(rows, null)), ['b', 'a', 'c', 'a2']);
    });

    it('見出しを押すたびに 昇順 → 降順 → 元の順、ほかの列は昇順から', () => {
        const asc = nextSort(null, 'name');
        assert.deepEqual(asc, { key: 'name', direction: 'asc' });
        const desc = nextSort(asc, 'name');
        assert.deepEqual(desc, { key: 'name', direction: 'desc' });
        assert.equal(nextSort(desc, 'name'), null);
        assert.deepEqual(nextSort(desc, 'count'), { key: 'count', direction: 'asc' });
    });

    it('CSV: 見出しはラベル、値は表と同じ文字、カンマ・引用符・改行は囲む、先頭に BOM', () => {
        const csv = tableToCsv(
            [
                { name: 'a,b', note: 'say "hi"', flag: true, list: ['x', 'y'] },
                { name: 'line\nbreak' },
            ],
            [
                { key: 'name', label: '名前' },
                { key: 'note', label: 'メモ' },
                { key: 'flag', label: 'フラグ' },
                { key: 'list', label: '一覧' },
            ],
        );
        assert.equal(csv.charCodeAt(0), 0xfeff);
        assert.equal(
            csv.slice(1),
            [
                '名前,メモ,フラグ,一覧',
                '"a,b","say ""hi""",はい,"x, y"',
                '"line\nbreak",,,',
                '',
            ].join('\r\n'),
        );
    });
});
