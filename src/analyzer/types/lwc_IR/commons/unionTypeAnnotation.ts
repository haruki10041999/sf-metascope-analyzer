import { isUnionTypeAnnotation, type UnionTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class UnionTypeAnnotationTypeClass extends LwcCommonTypeClass<'unionTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('unionTypeAnnotation', originalSource);
    }

    static create(
        target: UnionTypeAnnotation,
        originalSource: string,
    ): UnionTypeAnnotationTypeClass {
        throw new Error('UnionTypeAnnotationTypeClass.create is not implemented: ' + target.type);
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
