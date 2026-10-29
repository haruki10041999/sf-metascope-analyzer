import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeConvertType, regenerateSourceObjects } from '../../src/analyzer/types/apex/commons';
import { extractFindSearchTerm } from '../../src/analyzer/types/apex/converter/literal';
import { makeExpressionJsonConvert } from '../../src/analyzer/types/apex/expression';
import { makeSoqlFunctionJson } from '../../src/analyzer/types/apex/query/soqlFunction';
import { makeStatementJson } from '../../src/analyzer/types/apex/statement';
import { makeTriggerUnitJson } from '../../src/analyzer/types/apex/unit';

import { sourceInfo } from './helpers';

let offset = 0;
const si = () => sourceInfo(offset++);
const error = () => ({ type: 'error', sourceInfo: si(), errorCode: 'EXCEPTION', contextType: 'test' });
const expression = (value: string) => ({ type: 'expression', sourceInfo: si(), value });
const id = (value: string) => ({ type: 'id', sourceInfo: si(), value });
const statement = (value: unknown) => ({ type: 'statement', sourceInfo: si(), value });
const block = (...statements: unknown[]) => ({ type: 'block', sourceInfo: si(), value: statements });

// テスト用に CommonType を組み立てて変換する（型は converter 側の定義に任せる）
const convert = async (node: unknown) => (await makeConvertType(node as never)).result as never;

describe('JSON 生成のエラー処理', () => {
    it('境界ノードの部分木にエラーがあれば、境界ノードごと ErrorJson になる', async () => {
        const returnStatement = await convert(
            statement({
                type: 'returnStatement',
                sourceInfo: si(),
                value: { type: 'subExpression', sourceInfo: si(), value: error() },
            }),
        );

        const json: any = makeStatementJson(returnStatement);

        assert.equal(json.kind, 'error');
        assert.equal(json.kindType, 'return');
        assert.match(json.sourceKeys.objectKey, /^returnStatement_/);
    });

    it('境界ノードの範囲外のエラーは、その位置だけ ErrorJson になる', async () => {
        const call = await convert({
            type: 'methodCallExpression',
            sourceInfo: si(),
            value: {
                type: 'methodCall',
                sourceInfo: si(),
                value: id('foo'),
                reference: null,
                param: { type: 'expressionList', sourceInfo: si(), value: [expression('a'), error()] },
            },
        });

        const json: any = makeExpressionJsonConvert(call);

        assert.equal(json.member, 'foo');
        assert.equal(json.memberArg[0], 'a');
        assert.equal(json.memberArg[1].kind, 'error');
        assert.match(json.memberArg[1].sourceKeys.objectKey, /^error_/);
    });

    it('文そのものがエラーノードなら、その位置に ErrorJson が入る', async () => {
        const json: any = makeStatementJson(await convert(statement(error())));
        assert.equal(json.kind, 'error');
        assert.equal(json.kindType, 'statement');
    });

    it('複合文はノード自身だけを検査し、本体のエラーは本体の位置に残る', async () => {
        const ifStatement = await convert(
            statement({
                type: 'ifStatement',
                sourceInfo: si(),
                value: [
                    {
                        condition: { type: 'parExpression', sourceInfo: si(), value: expression('flag') },
                        block: statement(error()),
                    },
                ],
            }),
        );

        const json: any = makeStatementJson(ifStatement);

        assert.equal(json.kind, 'if');
        assert.equal(json.conditionBlock[0].condition.kind, 'ifCondition');
        assert.equal(json.conditionBlock[0].block.kind, 'error');
    });

    it('catch 本体のエラーで catch 条件はエラーにならない', async () => {
        const tryStatement = await convert(
            statement({
                type: 'tryStatement',
                sourceInfo: si(),
                block: block(),
                catchBlock: [
                    {
                        type: 'catchClause',
                        sourceInfo: si(),
                        value: id('e'),
                        valueType: { type: 'qualifiedName', sourceInfo: si(), value: [id('Exception')] },
                        modifier: [],
                        block: block(statement(error())),
                    },
                ],
                finallyBlock: null,
            }),
        );

        const json: any = makeStatementJson(tryStatement);
        const catchBlock = json.block[1];

        assert.equal(json.kind, 'try');
        assert.equal(catchBlock.catchCondition.kind, 'catchCondition');
        assert.equal(catchBlock.catchCondition.exception, 'e');
        assert.ok(catchBlock.catchCondition.sourceKeys.exception);
        assert.equal(catchBlock.block[0].kind, 'error');
    });

    it('for の init / update が省略されていても変換できる', async () => {
        const forStatement = await convert(
            statement({
                type: 'forStatement',
                sourceInfo: si(),
                value: { type: 'forControl', sourceInfo: si(), value: expression('i'), init: null, update: null },
                block: statement(block()),
            }),
        );

        const json: any = makeStatementJson(forStatement);

        assert.equal(json.kind, 'for');
        assert.equal(json.condition.condition, 'i');
        assert.equal(Object.hasOwn(json.condition, 'initializer'), false);
        assert.equal(Object.hasOwn(json.condition, 'update'), false);
    });

    it('DISTANCE の引数の形が想定と違えば ErrorJson にする', async () => {
        const distance = await convert({
            type: 'soqlFunction',
            sourceInfo: si(),
            value: 'DISTANCE',
            param: ['mi'],
        });

        const json: any = makeSoqlFunctionJson(distance);

        assert.equal(json.func, 'DISTANCE');
        assert.equal(json.arg.kind, 'error');
        assert.equal(json.arg.kindType, 'soqlFunction');
    });

    it('trigger 名・対象が欠けていても落ちずに ErrorJson にする', async () => {
        const trigger = await convert({
            type: 'triggerUnit',
            sourceInfo: si(),
            value: [id('OnlyName')],
            triggerCase: [],
            block: { type: 'triggerBlock', sourceInfo: si(), value: [] },
        });

        const json: any = makeTriggerUnitJson(trigger);

        assert.equal(json.name, 'OnlyName');
        assert.equal(json.object.kind, 'error');
    });
});

describe('SourceJson の再生成', () => {
    it('深い入れ子でも各ノードを 1 回だけ辿る', () => {
        let node: any = { kind: 'leaf', sourceKeys: { objectKey: 'o0', sourceKey: 's0' } };
        for (let i = 1; i <= 40; i++) {
            node = { kind: 'n', sourceKeys: { objectKey: `o${i}`, sourceKey: `s${i}` }, child: node };
        }
        const sources = [{ objectKey: 'o0', context: 'x', source: [{ sourceKey: 's0' } as never] }];

        const started = Date.now();
        const result = regenerateSourceObjects(sources, node);

        assert.ok(Date.now() - started < 1000);
        assert.deepEqual(result, sources);
    });

    it('StructureJson の配列のキーも登録する', () => {
        const json: any = {
            kind: 'catchCondition',
            sourceKeys: {
                base: { objectKey: 'base', sourceKey: 'b' },
                exceptionType: [{ objectKey: 'type', sourceKey: 't1' }],
            },
        };
        const sources = [
            { objectKey: 'base', context: 'x', source: [{ sourceKey: 'b' } as never] },
            { objectKey: 'type', context: 'x', source: [{ sourceKey: 't1' } as never, { sourceKey: 't2' } as never] },
        ];

        const result = regenerateSourceObjects(sources, json);

        assert.deepEqual(
            result.map((o) => [o.objectKey, o.source.map((s: any) => s.sourceKey)]),
            [
                ['base', ['b']],
                ['type', ['t1']],
            ],
        );
    });
});

describe('extractFindSearchTerm', () => {
    it('FIND リテラルから検索語だけを取り出す', () => {
        assert.equal(extractFindSearchTerm("[FIND 'test'"), 'test');
        assert.equal(extractFindSearchTerm("[\r\n    FIND 'a@example.com'"), 'a@example.com');
        assert.equal(extractFindSearchTerm("[FIND 'it\\'s'"), "it\\'s");
        assert.equal(extractFindSearchTerm('[FIND {help}'), 'help');
        assert.equal(extractFindSearchTerm('unexpected'), 'unexpected');
    });
});
