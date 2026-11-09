import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBindExpression, type BindExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from './index';

export type BindExpressionFields = TypeField<'bindExpression'> & {
    object: ExpressionTypeClass | null;
    callee: ExpressionTypeClass;
};

export class BindExpressionTypeClass extends LwcCommonTypeClass<
    'bindExpression',
    BindExpressionFields
> {
    private constructor(value: FieldsOf<BindExpressionFields>, sourceSpan: SourceSpan) {
        super('bindExpression', value, sourceSpan);
    }

    static create(target: BindExpression, originalSource: string): BindExpressionTypeClass {
        return new BindExpressionTypeClass(
            {
                object: visitOptionalNode(
                    target.object,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                callee: visitNode(
                    target.callee,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObject(): BindExpressionFields['object'] {
        return this.getFields().object;
    }

    getCallee(): BindExpressionFields['callee'] {
        return this.getFields().callee;
    }
}

export const bindExpressionTypePair: EvaluatePair<BindExpression, BindExpressionTypeClass> =
    makeEvaluatePair(isBindExpression, (target, originalSource) =>
        BindExpressionTypeClass.create(target, originalSource),
    );

export const isBindExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BindExpressionTypeClass => target instanceof BindExpressionTypeClass;
