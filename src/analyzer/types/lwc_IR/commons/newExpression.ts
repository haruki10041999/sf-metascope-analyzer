import { isNewExpression, type NewExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NewExpressionTypeClass extends LwcCommonTypeClass<'newExpression'> {
    private constructor(originalSource: string) {
        super('newExpression', originalSource);
    }

    static create(target: NewExpression, originalSource: string): NewExpressionTypeClass {
        throw new Error('NewExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const newExpressionTypePair: EvaluatePair<NewExpression, NewExpressionTypeClass> =
    makeEvaluatePair(isNewExpression, (target, originalSource) =>
        NewExpressionTypeClass.create(target, originalSource),
    );

export const isNewExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is NewExpressionTypeClass => target instanceof NewExpressionTypeClass;
