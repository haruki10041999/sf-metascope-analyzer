import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSSatisfiesExpression, type TSSatisfiesExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSSatisfiesExpressionFields = TypeField<'tSSatisfiesExpression'> & {
    expression: ExpressionTypeClass;
    typeAnnotation: TSTypeTypeClass;
};

export class TSSatisfiesExpressionTypeClass extends LwcCommonTypeClass<
    'tSSatisfiesExpression',
    TSSatisfiesExpressionFields
> {
    private constructor(value: FieldsOf<TSSatisfiesExpressionFields>, sourceSpan: SourceSpan) {
        super('tSSatisfiesExpression', value, sourceSpan);
    }

    static create(
        target: TSSatisfiesExpression,
        originalSource: string,
    ): TSSatisfiesExpressionTypeClass {
        return new TSSatisfiesExpressionTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TSSatisfiesExpressionFields['expression'] {
        return this.getFields().expression;
    }

    getTypeAnnotation(): TSSatisfiesExpressionFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSSatisfiesExpressionTypePair: EvaluatePair<
    TSSatisfiesExpression,
    TSSatisfiesExpressionTypeClass
> = makeEvaluatePair(isTSSatisfiesExpression, (target, originalSource) =>
    TSSatisfiesExpressionTypeClass.create(target, originalSource),
);

export const isTSSatisfiesExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSSatisfiesExpressionTypeClass => target instanceof TSSatisfiesExpressionTypeClass;
