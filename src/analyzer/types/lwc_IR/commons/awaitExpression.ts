import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isAwaitExpression, type AwaitExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type AwaitExpressionFields = TypeField<'awaitExpression'> & {
    argument: ExpressionTypeClass;
};

export class AwaitExpressionTypeClass extends LwcCommonTypeClass<
    'awaitExpression',
    AwaitExpressionFields
> {
    private constructor(value: FieldsOf<AwaitExpressionFields>, sourceSpan: SourceSpan) {
        super('awaitExpression', value, sourceSpan);
    }

    static create(target: AwaitExpression, originalSource: string): AwaitExpressionTypeClass {
        return new AwaitExpressionTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): AwaitExpressionFields['argument'] {
        return this.getFields().argument;
    }
}

export const awaitExpressionTypePair: EvaluatePair<AwaitExpression, AwaitExpressionTypeClass> =
    makeEvaluatePair(isAwaitExpression, (target, originalSource) =>
        AwaitExpressionTypeClass.create(target, originalSource),
    );

export const isAwaitExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is AwaitExpressionTypeClass => target instanceof AwaitExpressionTypeClass;
