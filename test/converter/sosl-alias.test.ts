import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { walkJson } from '../../src/analyzer/processor/commons/node';
import type { ApexNodeJson, SoslFieldJson } from '../../src/analyzer/types';

// SOSL の項目の、関数のあとの別名 (docs/plan.md 10 章 P1。サンプルにないので、ここで確かめる)

describe('SOSL の項目の別名', () => {
    it('TOLABEL(x) alias・FORMAT(x) alias の別名を alias に出す (関数のない項目は持たない)', async () => {
        const source = [
            'public class S {',
            '    void run() {',
            "        List<List<SObject>> r = [FIND 'x' RETURNING Account(Name, TOLABEL(Type) typeLabel, FORMAT(AnnualRevenue) revenue)];",
            '    }',
            '}',
        ].join('\n');
        const unit = await parseApexUnitFiles({
            unitType: 'class',
            name: 'S',
            filePath: 'S.cls',
            source: { fileName: 'S.cls', source },
        });
        assert.deepEqual(unit.resolvedError, []);
        const fields: SoslFieldJson[] = [];
        walkJson<ApexNodeJson>(unit.result.base as unknown as ApexNodeJson, {
            enter: { soslField: (node) => void fields.push(node) },
        });
        assert.deepEqual(
            fields.map((f) => [f.func ?? 'field', f.alias ?? null]),
            [
                ['field', null],
                ['TOLABEL', 'typeLabel'],
                ['FORMAT', 'revenue'],
            ],
        );
    });
});
