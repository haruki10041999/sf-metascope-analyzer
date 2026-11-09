import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isConditionalExpression, type ConditionalExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ConditionalExpressionFields = TypeField<'conditionalExpression'> & {
    test: ExpressionTypeClass;
    consequent: ExpressionTypeClass;
    alternate: ExpressionTypeClass;
};

export class ConditionalExpressionTypeClass extends LwcCommonTypeClass<
    'conditionalExpression',
    ConditionalExpressionFields
> {
    private constructor(value: FieldsOf<ConditionalExpressionFields>, sourceSpan: SourceSpan) {
        super('conditionalExpression', value, sourceSpan);
    }

    static create(
        target: ConditionalExpression,
        originalSource: string,
    ): ConditionalExpressionTypeClass {
        return new ConditionalExpressionTypeClass(
            {
                test: visitNode(
                    target.test,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                consequent: visitNode(
                    target.consequent,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                alternate: visitNode(
                    target.alternate,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTest(): ConditionalExpressionFields['test'] {
        return this.getFields().test;
    }

    getConsequent(): ConditionalExpressionFields['consequent'] {
        return this.getFields().consequent;
    }

    getAlternate(): ConditionalExpressionFields['alternate'] {
        return this.getFields().alternate;
    }
}

export const conditionalExpressionTypePair: EvaluatePair<
    ConditionalExpression,
    ConditionalExpressionTypeClass
> = makeEvaluatePair(isConditionalExpression, (target, originalSource) =>
    ConditionalExpressionTypeClass.create(target, originalSource),
);

export const isConditionalExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ConditionalExpressionTypeClass => target instanceof ConditionalExpressionTypeClass;
