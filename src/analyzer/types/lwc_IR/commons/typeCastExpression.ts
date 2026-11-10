import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeCastExpression, type TypeCastExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { TypeAnnotationTypeClass } from '../flowVisitor/typeAnnotation';

export type TypeCastExpressionFields = TypeField<'typeCastExpression'> & {
    expression: ExpressionTypeClass;
    typeAnnotation: TypeAnnotationTypeClass;
};

export class TypeCastExpressionTypeClass extends LwcCommonTypeClass<
    'typeCastExpression',
    TypeCastExpressionFields
> {
    private constructor(value: FieldsOf<TypeCastExpressionFields>, sourceSpan: SourceSpan) {
        super('typeCastExpression', value, sourceSpan);
    }

    static create(target: TypeCastExpression, originalSource: string): TypeCastExpressionTypeClass {
        return new TypeCastExpressionTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                typeAnnotation: TypeAnnotationTypeClass.create(
                    target.typeAnnotation,
                    originalSource,
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TypeCastExpressionFields['expression'] {
        return this.getFields().expression;
    }

    getTypeAnnotation(): TypeCastExpressionFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const typeCastExpressionTypePair: EvaluatePair<
    TypeCastExpression,
    TypeCastExpressionTypeClass
> = makeEvaluatePair(isTypeCastExpression, (target, originalSource) =>
    TypeCastExpressionTypeClass.create(target, originalSource),
);

export const isTypeCastExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeCastExpressionTypeClass => target instanceof TypeCastExpressionTypeClass;
