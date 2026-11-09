import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isVariance, type Variance } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type VarianceFields = TypeField<'variance'> & {
    kind: Variance['kind'];
};

export class VarianceTypeClass extends LwcCommonTypeClass<'variance', VarianceFields> {
    private constructor(value: FieldsOf<VarianceFields>, sourceSpan: SourceSpan) {
        super('variance', value, sourceSpan);
    }

    static create(target: Variance, originalSource: string): VarianceTypeClass {
        return new VarianceTypeClass(
            {
                kind: target.kind,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): VarianceFields['kind'] {
        return this.getFields().kind;
    }
}

export const varianceTypePair: EvaluatePair<Variance, VarianceTypeClass> = makeEvaluatePair(
    isVariance,
    (target, originalSource) => VarianceTypeClass.create(target, originalSource),
);

export const isVarianceType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is VarianceTypeClass => target instanceof VarianceTypeClass;
