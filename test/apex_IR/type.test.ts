import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectErrors, formatErrors, parse } from './helpers';

type TypeModule = typeof import('../../src/analyzer/types/apex_IR/typeVisitor');
type RestModule = typeof import('../../src/analyzer/types/apex_IR/restVisitor');
let typeV: TypeModule;
let rest: RestModule;

before(async () => {
    typeV = await import('../../src/analyzer/types/apex_IR/typeVisitor');
    rest = await import('../../src/analyzer/types/apex_IR/restVisitor');
});

const visitTypeRef = (source: string) => {
    const result = new typeV.TypeVisitor().visit(parse(source, (p) => p.typeRef()));
    assert.ok(typeV.isTypeRefType(result), result.getType());
    return result;
};

const dimensionOf = (source: string) => {
    const dimension = visitTypeRef(source).getDimension();
    assert.ok(dimension, `${source} の dimension が null`);
    return dimension.getValue();
};

describe('typeVisitor / typeRef', () => {
    for (const [source, dimension] of [
        ['String', 0],
        ['String[]', 1],
        ['Integer[][]', 2],
        ['List<String>', 0],
        ['List<String>[]', 1],
        ['Map<Id, Account>[]', 1],
    ] as const) {
        it(`"${source}" の配列次元は ${dimension}`, () => {
            assert.equal(dimensionOf(source), dimension);
        });
    }

    it('"System.Type" は typeName を 2 つ持つ', () => {
        assert.equal(visitTypeRef('System.Type').getValue().length, 2);
    });

    it('"Map<Id, List<Account>>" をエラーなしで変換できる', () => {
        const errors = collectErrors(visitTypeRef('Map<Id, List<Account>>'));
        assert.equal(errors.length, 0, formatErrors(errors));
    });

    it('型引数なしの "List" をエラーなしで変換できる', () => {
        const errors = collectErrors(visitTypeRef('List'));
        assert.equal(errors.length, 0, formatErrors(errors));
    });
});

describe('restVisitor / arrayCreatorRest', () => {
    it('"[5]" は size に式、value に null を持つ', () => {
        const result = new rest.RestVisitor().visit(parse('[5]', (p) => p.arrayCreatorRest()));
        assert.ok(rest.isArrayCreatorRestType(result), result.getType());
        assert.equal(result.getValue(), null);
        assert.ok(result.getSize(), 'size が null');
    });

    it('"[]{1, 2}" は value に arrayInitializer、size に null を持つ', () => {
        const result = new rest.RestVisitor().visit(
            parse('[]{1, 2}', (p) => p.arrayCreatorRest()),
        );
        assert.ok(rest.isArrayCreatorRestType(result), result.getType());
        assert.equal(result.getValue()?.getType(), 'arrayInitializer');
        assert.equal(result.getSize(), null);
    });
});
