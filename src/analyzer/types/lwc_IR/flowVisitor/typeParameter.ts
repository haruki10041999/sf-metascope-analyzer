import { isTypeParameter, type TypeParameter } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitOptionalNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { typeAnnotationTypePair, type TypeAnnotationTypeClass } from './typeAnnotation';
import { varianceTypePair, type VarianceTypeClass } from './variance';

const typeParameterBoundPairs = lazyPairs(() => [typeAnnotationTypePair] as const);
const typeParameterVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type TypeParameterFields = {
    name: TypeParameter['name'];
    bound: TypeAnnotationTypeClass | LwcErrorTypeClass | null;
    default: FlowTypeTypeClass | LwcErrorTypeClass | null;
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
};

export class TypeParameterTypeClass extends LwcCommonTypeClass<'typeParameter'> {
    private readonly value: TypeParameterFields;

    private constructor(value: TypeParameterFields) {
        super('typeParameter');
        this.value = value;
    }

    static create(target: TypeParameter, originalSource: string): TypeParameterTypeClass {
        return new TypeParameterTypeClass({
            name: target.name,
            bound: visitOptionalNode(
                target.bound,
                originalSource,
                typeParameterBoundPairs(),
                'TypeParameter.bound',
            ),
            default: visitOptionalNode(
                target.default,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                typeParameterVariancePairs(),
                'TypeParameter.variance',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TypeParameterFields {
        return this.value;
    }

    getName(): TypeParameterFields['name'] {
        return this.value.name;
    }

    getBound(): TypeParameterFields['bound'] {
        return this.value.bound;
    }

    getDefault(): TypeParameterFields['default'] {
        return this.value.default;
    }

    getVariance(): TypeParameterFields['variance'] {
        return this.value.variance;
    }
}

export const typeParameterTypePair: EvaluatePair<TypeParameter, TypeParameterTypeClass> =
    makeEvaluatePair(isTypeParameter, (target, originalSource) =>
        TypeParameterTypeClass.create(target, originalSource),
    );

export const isTypeParameterType = (
    target: LwcCommonTypeClass<string>,
): target is TypeParameterTypeClass => target instanceof TypeParameterTypeClass;
