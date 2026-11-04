import { isUpdateExpression, type UpdateExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class UpdateExpressionTypeClass extends LwcCommonTypeClass<'updateExpression'> {
    private constructor(originalSource: string) {
        super('updateExpression', originalSource);
    }

    static create(target: UpdateExpression, originalSource: string): UpdateExpressionTypeClass {
        throw new Error('UpdateExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const updateExpressionTypePair: EvaluatePair<UpdateExpression, UpdateExpressionTypeClass> =
    makeEvaluatePair(isUpdateExpression, (target, originalSource) =>
        UpdateExpressionTypeClass.create(target, originalSource),
    );

export const isUpdateExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is UpdateExpressionTypeClass => target instanceof UpdateExpressionTypeClass;
