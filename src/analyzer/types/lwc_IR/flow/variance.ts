import { isVariance, type Variance } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VarianceTypeClass extends LwcCommonTypeClass<'variance'> {
    private constructor(originalSource: string) {
        super('variance', originalSource);
    }

    static create(target: Variance, originalSource: string): VarianceTypeClass {
        throw new Error('VarianceTypeClass.create is not implemented: ' + target.type);
    }
}

export const varianceTypePair: EvaluatePair<Variance, VarianceTypeClass> = makeEvaluatePair(
    isVariance,
    (target, originalSource) => VarianceTypeClass.create(target, originalSource),
);

export const isVarianceType = (target: LwcCommonTypeClass<string>): target is VarianceTypeClass =>
    target instanceof VarianceTypeClass;
