import { isObjectTypeAnnotation, type ObjectTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypeAnnotationTypeClass extends LwcCommonTypeClass<'objectTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('objectTypeAnnotation', originalSource);
    }

    static create(
        target: ObjectTypeAnnotation,
        originalSource: string,
    ): ObjectTypeAnnotationTypeClass {
        throw new Error('ObjectTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const objectTypeAnnotationTypePair: EvaluatePair<
    ObjectTypeAnnotation,
    ObjectTypeAnnotationTypeClass
> = makeEvaluatePair(isObjectTypeAnnotation, (target, originalSource) =>
    ObjectTypeAnnotationTypeClass.create(target, originalSource),
);

export const isObjectTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeAnnotationTypeClass => target instanceof ObjectTypeAnnotationTypeClass;
