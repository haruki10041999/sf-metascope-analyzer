import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isYieldExpression, type YieldExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

/** `yield*` (delegate) は引数が要る */
export type YieldExpressionFields = TypeField<'yieldExpression'> &
    (
        | { delegate: true; argument: ExpressionTypeClass }
        | { delegate: false; argument: ExpressionTypeClass | null }
    );

export class YieldExpressionTypeClass extends LwcCommonTypeClass<
    'yieldExpression',
    YieldExpressionFields
> {
    private constructor(value: FieldsOf<YieldExpressionFields>, sourceSpan: SourceSpan) {
        super('yieldExpression', value, sourceSpan);
    }

    static create(target: YieldExpression, originalSource: string): YieldExpressionTypeClass {
        return new YieldExpressionTypeClass(
            target.delegate
                ? {
                      delegate: true,
                      argument: visitNode(
                          target.argument,
                          originalSource,
                          expressionVisitorEvaluatePairs(),
                          'ExpressionVisitor',
                      ),
                  }
                : {
                      delegate: false,
                      argument: visitOptionalNode(
                          target.argument,
                          originalSource,
                          expressionVisitorEvaluatePairs(),
                          'ExpressionVisitor',
                      ),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getDelegate(): YieldExpressionFields['delegate'] {
        return this.getFields().delegate;
    }

    getArgument(): YieldExpressionFields['argument'] {
        return this.getFields().argument;
    }
}

export const yieldExpressionTypePair: EvaluatePair<YieldExpression, YieldExpressionTypeClass> =
    makeEvaluatePair(isYieldExpression, (target, originalSource) =>
        YieldExpressionTypeClass.create(target, originalSource),
    );

export const isYieldExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is YieldExpressionTypeClass => target instanceof YieldExpressionTypeClass;
