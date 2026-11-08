import { isUnionTypeAnnotation, type UnionTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type UnionTypeAnnotationFields = {
    types: (FlowTypeTypeClass | LwcErrorTypeClass)[];
};

export class UnionTypeAnnotationTypeClass extends LwcCommonTypeClass<'unionTypeAnnotation'> {
    private readonly value: UnionTypeAnnotationFields;

    private constructor(value: UnionTypeAnnotationFields) {
        super('unionTypeAnnotation');
        this.value = value;
    }

    static create(
        target: UnionTypeAnnotation,
        originalSource: string,
    ): UnionTypeAnnotationTypeClass {
        return new UnionTypeAnnotationTypeClass({
            types: visitNodeList(
                target.types,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): UnionTypeAnnotationFields {
        return this.value;
    }

    getTypes(): UnionTypeAnnotationFields['types'] {
        return this.value.types;
    }
}

export const unionTypeAnnotationTypePair: EvaluatePair<
    UnionTypeAnnotation,
    UnionTypeAnnotationTypeClass
> = makeEvaluatePair(isUnionTypeAnnotation, (target, originalSource) =>
    UnionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isUnionTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is UnionTypeAnnotationTypeClass => target instanceof UnionTypeAnnotationTypeClass;
