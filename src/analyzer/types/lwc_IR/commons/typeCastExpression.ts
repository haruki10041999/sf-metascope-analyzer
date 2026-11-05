import { isTypeCastExpression, type TypeCastExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';

const typeCastExpressionTypeAnnotationPairs = lazyPairs(() => [typeAnnotationTypePair] as const);

export type TypeCastExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeAnnotation: TypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class TypeCastExpressionTypeClass extends LwcCommonTypeClass<'typeCastExpression'> {
    private readonly value: TypeCastExpressionFields;

    private constructor(value: TypeCastExpressionFields) {
        super('typeCastExpression');
        this.value = value;
    }

    static create(target: TypeCastExpression, originalSource: string): TypeCastExpressionTypeClass {
        return new TypeCastExpressionTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                typeCastExpressionTypeAnnotationPairs(),
                'TypeCastExpression.typeAnnotation',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeCastExpressionFields {
        return this.value;
    }

    getExpression(): TypeCastExpressionFields['expression'] {
        return this.value.expression;
    }

    getTypeAnnotation(): TypeCastExpressionFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const typeCastExpressionTypePair: EvaluatePair<
    TypeCastExpression,
    TypeCastExpressionTypeClass
> = makeEvaluatePair(isTypeCastExpression, (target, originalSource) =>
    TypeCastExpressionTypeClass.create(target, originalSource),
);

export const isTypeCastExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TypeCastExpressionTypeClass => target instanceof TypeCastExpressionTypeClass;
