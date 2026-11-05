import { isVariance, type Variance } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type VarianceFields = {
    kind: Variance['kind'];
};

export class VarianceTypeClass extends LwcCommonTypeClass<'variance'> {
    private readonly value: VarianceFields;

    private constructor(value: VarianceFields) {
        super('variance');
        this.value = value;
    }

    static create(target: Variance, originalSource: string): VarianceTypeClass {
        return new VarianceTypeClass({
            kind: target.kind,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): VarianceFields {
        return this.value;
    }

    getKind(): VarianceFields['kind'] {
        return this.value.kind;
    }
}

export const varianceTypePair: EvaluatePair<Variance, VarianceTypeClass> = makeEvaluatePair(
    isVariance,
    (target, originalSource) => VarianceTypeClass.create(target, originalSource),
);

export const isVarianceType = (target: LwcCommonTypeClass<string>): target is VarianceTypeClass =>
    target instanceof VarianceTypeClass;
