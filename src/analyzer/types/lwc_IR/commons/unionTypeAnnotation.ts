import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isUnionTypeAnnotation, type UnionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type UnionTypeAnnotationFields = TypeField<'unionTypeAnnotation'> & {
    types: FlowTypeTypeClass[];
};

export class UnionTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'unionTypeAnnotation',
    UnionTypeAnnotationFields
> {
    private constructor(value: FieldsOf<UnionTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('unionTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: UnionTypeAnnotation,
        originalSource: string,
    ): UnionTypeAnnotationTypeClass {
        return new UnionTypeAnnotationTypeClass(
            {
                types: visitNodeList(
                    target.types,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypes(): UnionTypeAnnotationFields['types'] {
        return this.getFields().types;
    }
}

export const unionTypeAnnotationTypePair: EvaluatePair<
    UnionTypeAnnotation,
    UnionTypeAnnotationTypeClass
> = makeEvaluatePair(isUnionTypeAnnotation, (target, originalSource) =>
    UnionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isUnionTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is UnionTypeAnnotationTypeClass => target instanceof UnionTypeAnnotationTypeClass;
