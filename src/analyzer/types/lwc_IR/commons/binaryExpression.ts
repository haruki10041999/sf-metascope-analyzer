import { isBinaryExpression, type BinaryExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BinaryExpressionTypeClass extends LwcCommonTypeClass<'binaryExpression'> {
    private constructor(originalSource: string) {
        super('binaryExpression', originalSource);
    }

    static create(target: BinaryExpression, originalSource: string): BinaryExpressionTypeClass {
        throw new Error('BinaryExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const binaryExpressionTypePair: EvaluatePair<BinaryExpression, BinaryExpressionTypeClass> =
    makeEvaluatePair(isBinaryExpression, (target, originalSource) =>
        BinaryExpressionTypeClass.create(target, originalSource),
    );

export const isBinaryExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is BinaryExpressionTypeClass => target instanceof BinaryExpressionTypeClass;
