import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeParameter, type TypeParameter } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { TypeAnnotationTypeClass } from './typeAnnotation';
import { VarianceTypeClass } from './variance';

export type TypeParameterFields = TypeField<'typeParameter'> & {
    name: TypeParameter['name'];
    bound: TypeAnnotationTypeClass | null;
    default: FlowTypeTypeClass | null;
    variance: VarianceTypeClass | null;
};

export class TypeParameterTypeClass extends LwcCommonTypeClass<
    'typeParameter',
    TypeParameterFields
> {
    private constructor(value: FieldsOf<TypeParameterFields>, sourceSpan: SourceSpan) {
        super('typeParameter', value, sourceSpan);
    }

    static create(target: TypeParameter, originalSource: string): TypeParameterTypeClass {
        return new TypeParameterTypeClass(
            {
                name: target.name,
                bound:
                    target.bound == null
                        ? null
                        : TypeAnnotationTypeClass.create(target.bound, originalSource),
                default: visitOptionalNode(
                    target.default,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                variance:
                    target.variance == null
                        ? null
                        : VarianceTypeClass.create(target.variance, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): TypeParameterFields['name'] {
        return this.getFields().name;
    }

    getBound(): TypeParameterFields['bound'] {
        return this.getFields().bound;
    }

    getDefault(): TypeParameterFields['default'] {
        return this.getFields().default;
    }

    getVariance(): TypeParameterFields['variance'] {
        return this.getFields().variance;
    }
}

export const typeParameterTypePair: EvaluatePair<TypeParameter, TypeParameterTypeClass> =
    makeEvaluatePair(isTypeParameter, (target, originalSource) =>
        TypeParameterTypeClass.create(target, originalSource),
    );

export const isTypeParameterType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeParameterTypeClass => target instanceof TypeParameterTypeClass;
