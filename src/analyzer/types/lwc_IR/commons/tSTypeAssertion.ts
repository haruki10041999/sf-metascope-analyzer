import { isTSTypeAssertion, type TSTypeAssertion } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeAssertionFields = {
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class TSTypeAssertionTypeClass extends LwcCommonTypeClass<'tSTypeAssertion'> {
    private readonly value: TSTypeAssertionFields;

    private constructor(value: TSTypeAssertionFields) {
        super('tSTypeAssertion');
        this.value = value;
    }

    static create(target: TSTypeAssertion, originalSource: string): TSTypeAssertionTypeClass {
        return new TSTypeAssertionTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeAssertionFields {
        return this.value;
    }

    getTypeAnnotation(): TSTypeAssertionFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getExpression(): TSTypeAssertionFields['expression'] {
        return this.value.expression;
    }
}

export const tSTypeAssertionTypePair: EvaluatePair<TSTypeAssertion, TSTypeAssertionTypeClass> =
    makeEvaluatePair(isTSTypeAssertion, (target, originalSource) =>
        TSTypeAssertionTypeClass.create(target, originalSource),
    );

export const isTSTypeAssertionType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAssertionTypeClass => target instanceof TSTypeAssertionTypeClass;
