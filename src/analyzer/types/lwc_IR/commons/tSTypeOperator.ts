import { isTSTypeOperator, type TSTypeOperator } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeOperatorTypeClass extends LwcCommonTypeClass<'tSTypeOperator'> {
    private constructor(originalSource: string) {
        super('tSTypeOperator', originalSource);
    }

    static create(target: TSTypeOperator, originalSource: string): TSTypeOperatorTypeClass {
        throw new Error('TSTypeOperatorTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeOperatorTypePair: EvaluatePair<TSTypeOperator, TSTypeOperatorTypeClass> =
    makeEvaluatePair(isTSTypeOperator, (target, originalSource) =>
        TSTypeOperatorTypeClass.create(target, originalSource),
    );

export const isTSTypeOperatorType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeOperatorTypeClass => target instanceof TSTypeOperatorTypeClass;
