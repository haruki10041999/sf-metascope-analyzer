import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { ApexParser, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { collectErrors, collectTypes, formatErrors, parse } from './helpers';

type UnitModule = typeof import('../../src/analyzer/types/apex_IR/unitVisitor');
let unit: UnitModule;

before(async () => {
    unit = await import('../../src/analyzer/types/apex_IR/unitVisitor');
});

const examples: [string, (p: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (p) => p.compilationUnit()],
    ['ParserTrigger.trigger', (p) => p.triggerUnit()],
    ['parser.apex', (p) => p.anonymousUnit()],
];

const load = (file: string) =>
    readFile(new URL(`../../docs/examples/apex-ir/${file}`, import.meta.url), 'utf8');

describe('docs/examples/apex-ir', () => {
    for (const [file, rule] of examples) {
        it(`${file} を構文エラー・IR エラーなしで変換できる`, async () => {
            const result = new unit.UnitVisitor().visit(parse(await load(file), rule));
            const errors = collectErrors(result);
            assert.equal(errors.length, 0, formatErrors(errors));
        });
    }

    it('3 ファイル合計で IR の主要ノード種別をすべて含む', async () => {
        const types = new Set<string>();
        for (const [file, rule] of examples) {
            const result = new unit.UnitVisitor().visit(parse(await load(file), rule));
            collectTypes(result).forEach((t) => types.add(t));
        }

        const expected = [
            // unit / declaration
            'compilationUnit',
            'triggerUnit',
            'triggerCase',
            'anonymousUnit',
            'classDeclaration',
            'interfaceDeclaration',
            'enumDeclaration',
            'enumConstants',
            'methodDeclaration',
            'constructorDeclaration',
            'fieldDeclaration',
            'propertyDeclaration',
            'interfaceMethodDeclaration',
            'classBodyDeclaration',
            'localVariableDeclaration',
            'propertyBlock',
            'getter',
            'setter',
            'annotation',
            // statement
            'ifStatement',
            'switchStatement',
            'forStatement',
            'whileStatement',
            'doWhileStatement',
            'tryStatement',
            'returnStatement',
            'throwStatement',
            'breakStatement',
            'continueStatement',
            'insertStatement',
            'updateStatement',
            'deleteStatement',
            'undeleteStatement',
            'upsertStatement',
            'mergeStatement',
            'runAsStatement',
            'accessLevel',
            'catchClause',
            'finallyBlock',
            'forControl',
            'enhancedForControl',
            'whenControl',
            'whenValue',
            // expression
            'arrayExpression',
            'arth1Expression',
            'arth2Expression',
            'assignExpression',
            'bitAndExpression',
            'bitExpression',
            'bitNotExpression',
            'bitOrExpression',
            'castExpression',
            'cmpExpression',
            'coalExpression',
            'condExpression',
            'dotExpression',
            'equalityExpression',
            'instanceOfExpression',
            'logAndExpression',
            'logOrExpression',
            'methodCallExpression',
            'negExpression',
            'newExpression',
            'postOpExpression',
            'preOpExpression',
            'subExpression',
            // primary / creator
            'thisPrimary',
            'superPrimary',
            'voidPrimary',
            'typeRefPrimary',
            'literalPrimary',
            'soqlPrimary',
            'soslPrimary',
            'noRest',
            'classCreatorRest',
            'arrayCreatorRest',
            'mapCreatorRest',
            'setCreatorRest',
            'arrayInitializer',
            // SOQL
            'subQuery',
            'typeOf',
            'whenClause',
            'elseClause',
            'usingScope',
            'whereClause',
            'withClause',
            'groupByClause',
            'orderByClause',
            'limitClause',
            'offsetClause',
            'allRowsClause',
            'forClauses',
            'updateType',
            'soqlFunction',
            'dateFormula',
            'boundExpression',
            'dataCategorySelection',
            'filteringSelector',
            'filteringExpression',
            'whereLogicalExpression',
            'whereFieldExpression',
            'logicalExpression',
            'conditionalExpression',
            'fieldExpression',
            'fieldGroupBy',
            'fieldOrder',
            'subFieldEntry',
            'signedInteger',
            'signedNumber',
            'soqlFieldsParameter',
            'locationValue',
            'coordinateValue',
            // SOSL
            'soslClauses',
            'soslWithClause',
            'searchGroup',
            'fieldSpec',
            'soslField',
            'networkList',
            // その他
            'fromName',
            'anonymousBlockMember',
            'triggerBlockMember',
            'elementValuePairs',
            'mapCreatorRestPair',
            'idCreatedNamePair',
            'typeArguments',
        ];
        const missing = expected.filter((t) => !types.has(t));
        assert.deepEqual(missing, []);
    });
});
