import { isTSLiteralType, type TSLiteralType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { bigIntLiteralTypePair, type BigIntLiteralTypeClass } from './bigIntLiteral';
import { booleanLiteralTypePair, type BooleanLiteralTypeClass } from './booleanLiteral';
import { numericLiteralTypePair, type NumericLiteralTypeClass } from './numericLiteral';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';
import { templateLiteralTypePair, type TemplateLiteralTypeClass } from './templateLiteral';
import { unaryExpressionTypePair, type UnaryExpressionTypeClass } from './unaryExpression';

const tSLiteralTypeLiteralPairs = lazyPairs(
    () =>
        [
            numericLiteralTypePair,
            stringLiteralTypePair,
            booleanLiteralTypePair,
            bigIntLiteralTypePair,
            templateLiteralTypePair,
            unaryExpressionTypePair,
        ] as const,
);

export type TSLiteralTypeFields = {
    literal:
        | NumericLiteralTypeClass
        | StringLiteralTypeClass
        | BooleanLiteralTypeClass
        | BigIntLiteralTypeClass
        | TemplateLiteralTypeClass
        | UnaryExpressionTypeClass
        | LwcErrorTypeClass;
};

export class TSLiteralTypeTypeClass extends LwcCommonTypeClass<'tSLiteralType'> {
    private readonly value: TSLiteralTypeFields;

    private constructor(value: TSLiteralTypeFields) {
        super('tSLiteralType');
        this.value = value;
    }

    static create(target: TSLiteralType, originalSource: string): TSLiteralTypeTypeClass {
        return new TSLiteralTypeTypeClass({
            literal: visitNode(
                target.literal,
                originalSource,
                tSLiteralTypeLiteralPairs(),
                'TSLiteralType.literal',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSLiteralTypeFields {
        return this.value;
    }

    getLiteral(): TSLiteralTypeFields['literal'] {
        return this.value.literal;
    }
}

export const tSLiteralTypeTypePair: EvaluatePair<TSLiteralType, TSLiteralTypeTypeClass> =
    makeEvaluatePair(isTSLiteralType, (target, originalSource) =>
        TSLiteralTypeTypeClass.create(target, originalSource),
    );

export const isTSLiteralTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSLiteralTypeTypeClass => target instanceof TSLiteralTypeTypeClass;
