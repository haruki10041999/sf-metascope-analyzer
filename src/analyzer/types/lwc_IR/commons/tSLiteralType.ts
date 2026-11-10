import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import {
    isBigIntLiteral,
    isNumericLiteral,
    isTSLiteralType,
    isUnaryExpression,
    type TSLiteralType,
} from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from './bigIntLiteral';
import { booleanLiteralTypePair, type BooleanLiteralTypeClass } from './booleanLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from './numericLiteral';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';
import { templateLiteralTypePair, type TemplateLiteralTypeClass } from './templateLiteral';

const tSLiteralTypeLiteralPairs = lazyPairs(
    () =>
        [
            numericLiteralTypePair,
            stringLiteralTypePair,
            booleanLiteralTypePair,
            bigIntLiteralTypePair,
            templateLiteralTypePair,
        ] as const,
);

/** 負の数のリテラル型 (`-1`・`-1n`)。Babel では UnaryExpression で表される */
export type TSNegativeLiteral = {
    kind: 'negative';
    argument: NumericLiteralTypeClass | BigIntLiteralTypeClass;
};

export type TSLiteralTypeFields = TypeField<'tSLiteralType'> & {
    literal:
        | NumericLiteralTypeClass
        | StringLiteralTypeClass
        | BooleanLiteralTypeClass
        | BigIntLiteralTypeClass
        | TemplateLiteralTypeClass
        | TSNegativeLiteral;
};

const createNegativeLiteral = (
    target: Extract<TSLiteralType['literal'], { type: 'UnaryExpression' }>,
    originalSource: string,
): TSNegativeLiteral => {
    if (target.operator === '-' && isNumericLiteral(target.argument)) {
        return {
            kind: 'negative',
            argument: NumericLiteralTypeClass.create(target.argument, originalSource),
        };
    }
    if (target.operator === '-' && isBigIntLiteral(target.argument)) {
        return {
            kind: 'negative',
            argument: BigIntLiteralTypeClass.create(target.argument, originalSource),
        };
    }
    return failIrBuild(
        'TYPE_MISMATCH',
        target,
        originalSource,
        'リテラル型に書ける単項演算は、数の符号 (-1・-1n) だけです',
    );
};

export class TSLiteralTypeTypeClass extends LwcCommonTypeClass<
    'tSLiteralType',
    TSLiteralTypeFields
> {
    private constructor(value: FieldsOf<TSLiteralTypeFields>, sourceSpan: SourceSpan) {
        super('tSLiteralType', value, sourceSpan);
    }

    static create(target: TSLiteralType, originalSource: string): TSLiteralTypeTypeClass {
        return new TSLiteralTypeTypeClass(
            {
                literal: isUnaryExpression(target.literal)
                    ? createNegativeLiteral(target.literal, originalSource)
                    : visitNode(
                          target.literal,
                          originalSource,
                          tSLiteralTypeLiteralPairs(),
                          'TSLiteralType.literal',
                      ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLiteral(): TSLiteralTypeFields['literal'] {
        return this.getFields().literal;
    }
}

export const tSLiteralTypeTypePair: EvaluatePair<TSLiteralType, TSLiteralTypeTypeClass> =
    makeEvaluatePair(isTSLiteralType, (target, originalSource) =>
        TSLiteralTypeTypeClass.create(target, originalSource),
    );

export const isTSLiteralTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSLiteralTypeTypeClass => target instanceof TSLiteralTypeTypeClass;
