import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const folders = [
    'argumentsVisitor',
    'blockVisitor',
    'bodyVisitor',
    'callVisitor',
    'clauseVisitor',
    'controlVisitor',
    'declarationVisitor',
    'entryVisitor',
    'expressionVisitor',
    'idVisitor',
    'listVisitor',
    'literalVisitor',
    'memberVisitor',
    'modifierVisitor',
    'nameVisitor',
    'pairVisitor',
    'parameterVisitor',
    'primaryVisitor',
    'queryVisitor',
    'restVisitor',
    'statementVisitor',
    'typeVisitor',
    'unitVisitor',
    'valueVisitor',
    'variableVisitor',
];

describe('apex_IR モジュール読み込み', () => {
    it('apex_IR/index.ts が循環 import の TDZ エラーなしで読み込める', async () => {
        await assert.doesNotReject(() => import('../../src/analyzer/types/apex_IR/index'));
    });

    for (const folder of folders) {
        it(`${folder}/index.ts を単独で読み込める`, async () => {
            await assert.doesNotReject(
                () => import(`../../src/analyzer/types/apex_IR/${folder}/index.ts`),
            );
        });
    }
});
