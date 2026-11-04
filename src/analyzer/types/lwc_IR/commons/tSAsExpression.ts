import { isTSAsExpression, type TSAsExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSAsExpressionTypeClass extends LwcCommonTypeClass<'tSAsExpression'> {
    private constructor(originalSource: string) {
        super('tSAsExpression', originalSource);
    }

    static create(target: TSAsExpression, originalSource: string): TSAsExpressionTypeClass {
        throw new Error('TSAsExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSAsExpressionTypePair: EvaluatePair<TSAsExpression, TSAsExpressionTypeClass> =
    makeEvaluatePair(isTSAsExpression, (target, originalSource) =>
        TSAsExpressionTypeClass.create(target, originalSource),
    );

export const isTSAsExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSAsExpressionTypeClass => target instanceof TSAsExpressionTypeClass;
