import { isObjectExpression, type ObjectExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectExpressionTypeClass extends LwcCommonTypeClass<'objectExpression'> {
    private constructor(originalSource: string) {
        super('objectExpression', originalSource);
    }

    static create(target: ObjectExpression, originalSource: string): ObjectExpressionTypeClass {
        throw new Error('ObjectExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectExpressionTypePair: EvaluatePair<ObjectExpression, ObjectExpressionTypeClass> =
    makeEvaluatePair(isObjectExpression, (target, originalSource) =>
        ObjectExpressionTypeClass.create(target, originalSource),
    );

export const isObjectExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectExpressionTypeClass => target instanceof ObjectExpressionTypeClass;
