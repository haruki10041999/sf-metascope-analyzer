import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { ApexParser, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { parse } from '../apex_IR/helpers';

type UnitVisitorModule = typeof import('../../src/analyzer/types/apex_IR/unitVisitor');
type ConverterModule = typeof import('../../src/analyzer/types/apex/converter');
type UnitOutputModule = typeof import('../../src/analyzer/types/apex/unit');
type IRModule = typeof import('../../src/analyzer/types/apex_IR');
let unitVisitor: UnitVisitorModule;
let converter: ConverterModule;
let unitOutput: UnitOutputModule;
let ir: IRModule;

before(async () => {
    unitVisitor = await import('../../src/analyzer/types/apex_IR/unitVisitor');
    converter = await import('../../src/analyzer/types/apex/converter');
    unitOutput = await import('../../src/analyzer/types/apex/unit');
    ir = await import('../../src/analyzer/types/apex_IR');
});

const examples: [string, (p: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (p) => p.compilationUnit()],
    ['ParserTrigger.trigger', (p) => p.triggerUnit()],
    ['parser.apex', (p) => p.anonymousUnit()],
];

const load = (file: string) =>
    readFile(new URL(`../../docs/examples/apex-ir/${file}`, import.meta.url), 'utf8');

const convert = async (file: string, rule: (p: ApexParser) => ApexParserRuleContext) => {
    const unit = new unitVisitor.UnitVisitor().visit(parse(await load(file), rule));
    const errors: InstanceType<IRModule['ErrorTypeClass']>[] = [];
    let converted: unknown;
    if (ir.isCompilationUnitType(unit)) converted = converter.compilationUnitConvert(unit, errors);
    else if (ir.isTriggerUnitType(unit)) converted = converter.triggerUnitConvert(unit, errors);
    else if (ir.isAnonymousUnitType(unit)) converted = converter.anonymousUnitConvert(unit, errors);
    else throw new Error(`Unsupported unit type: ${unit.getType()}`);
    return {
        unit,
        converted: JSON.parse(JSON.stringify(converted)),
        convertedClass: converted,
        errors,
    };
};

const convertOutput = async (file: string, rule: (p: ApexParser) => ApexParserRuleContext) => {
    const result = await convert(file, rule);
    let output: unknown;
    if (ir.isCompilationUnitType(result.unit)) {
        output = unitOutput.makeCompilationUnitType(result.convertedClass as any);
    } else if (ir.isTriggerUnitType(result.unit)) {
        output = unitOutput.makeTriggerUnitType(result.convertedClass as any);
    } else if (ir.isAnonymousUnitType(result.unit)) {
        output = unitOutput.makeAnonymousUnitType(result.convertedClass as any);
    }
    return JSON.parse(JSON.stringify(output));
};

// IR の構造キーや、converter が null に正規化する arraySubscripts の 0 / isStatic の false は比較対象外
const SKIP_KEYS = new Set(['type', 'span', 'contextType']);
const collectValues = (node: unknown, out = new Map<string, number>()) => {
    if (node === null || node === undefined || node === 0 || node === false) return out;
    if (Array.isArray(node)) {
        node.forEach((n) => collectValues(n, out));
    } else if (typeof node === 'object') {
        Object.entries(node).forEach(([k, v]) => !SKIP_KEYS.has(k) && collectValues(v, out));
    } else {
        const key = `${typeof node}:${String(node)}`;
        out.set(key, (out.get(key) ?? 0) + 1);
    }
    return out;
};

const find = (node: any, predicate: (n: any) => boolean): any[] => {
    if (node === null || typeof node !== 'object') return [];
    const self = predicate(node) ? [node] : [];
    return [...self, ...Object.values(node).flatMap((v) => find(v, predicate))];
};

describe('converter / docs/examples/apex-ir', () => {
    for (const [file, rule] of examples) {
        it(`${file} を変換エラーなしで変換でき、IR の値を欠落させない`, async () => {
            const { unit, converted, errors } = await convert(file, rule);
            assert.equal(errors.length, 0);

            const irValues = collectValues(JSON.parse(JSON.stringify(unit)));
            const convertedValues = collectValues(converted);
            const missing = [...irValues]
                .filter(([k, n]) => (convertedValues.get(k) ?? 0) < n)
                .map(([k, n]) => `${k} x${n - (convertedValues.get(k) ?? 0)}`);
            assert.deepEqual(missing, []);
        });
    }

    it('フィールド宣言の変数名・初期値を保持する', async () => {
        const { converted } = await convert(...examples[0]);
        const fields = find(converted, (n) => n.type === 'field').map((n) => n.declaration);
        assert.deepEqual(
            fields
                .find((f) => f.value.some((v: any) => v.value === 'first'))
                .value.map((v: any) => v.value),
            ['first', 'second', 'third'],
        );
    });

    it('トップレベル型の修飾子と implements を保持する', async () => {
        const { converted } = await convert(...examples[0]);
        const modifiers = converted.modifier.map((m: any) => m.value.modifier);
        assert.ok(modifiers.includes('INHERITED_SHARING'));
        assert.deepEqual(
            converted.value.declaration.implement.map((t: any) => t.value[0].value),
            ['ParserInterface', 'Comparable'],
        );
    });

    it('getter 本体・merge 対象・GROUP BY / HAVING を保持する', async () => {
        const { converted } = await convert(...examples[0]);
        const getter = find(converted, (n) => n.type === 'getter' && n.value.length > 0);
        assert.equal(getter.length, 1);

        const merges = find(converted, (n) => n.type === 'merge');
        merges.forEach((m) => assert.equal(m.statement.value.length, 2));

        const groupBy = find(converted, (n) => n.groupByClause?.mode === 'ROLLUP');
        assert.equal(groupBy.length, 1);
    });

    it('if / for 本体のブロック文を保持する', async () => {
        const { converted } = await convert(...examples[2]);
        const blocks = find(converted, (n) => n.type === 'block');
        assert.ok(blocks.length > 0);
        blocks.forEach((b) => assert.ok(Array.isArray(b.statement)));
    });

    it('トリガー名・対象 SObject とトリガー内メンバー宣言を保持する', async () => {
        const { converted } = await convert(...examples[1]);
        assert.deepEqual(converted.value, ['ParserTrigger', 'Account']);
        const declarations = converted.block.filter((b: any) => b.modifier.length > 0);
        assert.ok(declarations.length > 0);
        declarations.forEach((d: any) => assert.notEqual(d.value?.value, null));
    });

    it('JSON 出力で SOQL の LIMIT / OFFSET と日付式の引数を保持する', async () => {
        const output = await convertOutput(...examples[0]);
        const offsetQueries = find(
            output,
            (n) => n.offset !== undefined && n.from?.field !== undefined,
        );
        assert.equal(offsetQueries.length, 2);
        assert.ok(
            offsetQueries.some(
                (query) => query.limit?.kind === 'number' && query.limit.value === '100',
            ),
        );
        assert.ok(
            offsetQueries.some(
                (query) => query.limit?.kind === 'bind' && query.limit.value.value === 'pageSize',
            ),
        );
        assert.ok(offsetQueries.some((query) => query.offset?.value === '10'));
        assert.ok(offsetQueries.some((query) => query.offset?.kind === 'bind'));

        const dateFormula = find(output, (n) => n.kind === 'dateFormula').find(
            (value) => value.funcName === 'LAST_N_DAYS_N',
        );
        assert.equal(dateFormula?.param?.value, '30');
    });

    it('JSON 出力で空 return / for と finally の有無を保持する', async () => {
        const output = await convertOutput(...examples[0]);
        assert.ok(find(output, (n) => n.kind === 'return' && n.block === undefined).length > 0);
        assert.ok(
            find(output, (n) => n.kind === 'for' && Object.keys(n.condition ?? {}).length === 0)
                .length > 0,
        );

        const triggerOutput = await convertOutput(...examples[1]);
        const tryStatements = find(triggerOutput, (n) => n.kind === 'try');
        assert.ok(tryStatements.length > 0);
        tryStatements.forEach((statement) =>
            assert.equal(
                statement.block.some((block: any) => block.type === 'finally'),
                false,
            ),
        );
    });

    it('JSON 出力で修飾子と型付きキー名を保持する', async () => {
        const output = await convertOutput(...examples[0]);
        assert.ok(find(output, (n) => n.sharing?.includes('INHERITED_SHARING')).length > 0);
        assert.ok(find(output, (n) => n.externalKey !== undefined).length > 0);
        assert.ok(find(output, (n) => n.exceptionType !== undefined).length > 0);
        assert.ok(
            find(output, (n) => n.kind === 'ternary' && n.trueValue !== undefined).length > 0,
        );
    });

    it('JSON 出力で配列アクセスと空の配列生成を区別する', async () => {
        const output = await convertOutput(...examples[0]);
        const arrayAccesses = find(output, (n) => n.kind === 'arrayAccess');
        assert.ok(arrayAccesses.some((n) => n.object?.value === 'sized'));
        assert.ok(arrayAccesses.some((n) => n.object?.value === 'numbers'));
        assert.ok(
            find(output, (n) => n.creatorType === 'array' && Array.isArray(n.initValue)).length > 0,
        );
        assert.ok(
            find(output, (n) => n.creatorType === 'set' && n.initialValue?.length === 0).length > 0,
        );
        assert.ok(
            find(output, (n) => n.creatorType === 'list' && n.initialValue?.length === 2).length >
                0,
        );
    });

    it('anonymous / trigger の SOQL・SOSL を unit 単位で抽出する', async () => {
        for (const example of [examples[1], examples[2]]) {
            const output = await convertOutput(...example);
            const references = find(output, (n) => n.kind === 'queryRef');
            const inlineQueries = find(output, (n) => n.kind === 'soql' || n.kind === 'sosl');

            assert.ok(references.length > 0);
            assert.equal(inlineQueries.length, 0);
            references.forEach((reference) => {
                const indexKey = `${reference.queryKind}Index`;
                assert.ok(find(output, (n) => n[indexKey] === reference.index).length > 0);
            });
        }
    });
});
