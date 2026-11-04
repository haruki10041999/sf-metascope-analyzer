import { isBindExpression, type BindExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BindExpressionTypeClass extends LwcCommonTypeClass<'bindExpression'> {
    private constructor(originalSource: string) {
        super('bindExpression', originalSource);
    }

    static create(target: BindExpression, originalSource: string): BindExpressionTypeClass {
        throw new Error('BindExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const bindExpressionTypePair: EvaluatePair<BindExpression, BindExpressionTypeClass> =
    makeEvaluatePair(isBindExpression, (target, originalSource) =>
        BindExpressionTypeClass.create(target, originalSource),
    );

export const isBindExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is BindExpressionTypeClass => target instanceof BindExpressionTypeClass;
