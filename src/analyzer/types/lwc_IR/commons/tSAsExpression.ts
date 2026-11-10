import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSAsExpression, type TSAsExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSAsExpressionFields = TypeField<'tSAsExpression'> & {
    expression: ExpressionTypeClass;
    typeAnnotation: TSTypeTypeClass;
};

export class TSAsExpressionTypeClass extends LwcCommonTypeClass<
    'tSAsExpression',
    TSAsExpressionFields
> {
    private constructor(value: FieldsOf<TSAsExpressionFields>, sourceSpan: SourceSpan) {
        super('tSAsExpression', value, sourceSpan);
    }

    static create(target: TSAsExpression, originalSource: string): TSAsExpressionTypeClass {
        return new TSAsExpressionTypeClass(
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

    getExpression(): TSAsExpressionFields['expression'] {
        return this.getFields().expression;
    }

    getTypeAnnotation(): TSAsExpressionFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSAsExpressionTypePair: EvaluatePair<TSAsExpression, TSAsExpressionTypeClass> =
    makeEvaluatePair(isTSAsExpression, (target, originalSource) =>
        TSAsExpressionTypeClass.create(target, originalSource),
    );

export const isTSAsExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSAsExpressionTypeClass => target instanceof TSAsExpressionTypeClass;
