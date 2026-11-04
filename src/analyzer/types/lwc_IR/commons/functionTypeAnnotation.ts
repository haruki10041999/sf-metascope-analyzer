import { isFunctionTypeAnnotation, type FunctionTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class FunctionTypeAnnotationTypeClass extends LwcCommonTypeClass<'functionTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('functionTypeAnnotation', originalSource);
    }

    static create(
        target: FunctionTypeAnnotation,
        originalSource: string,
    ): FunctionTypeAnnotationTypeClass {
        throw new Error(
            'FunctionTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const functionTypeAnnotationTypePair: EvaluatePair<
    FunctionTypeAnnotation,
    FunctionTypeAnnotationTypeClass
> = makeEvaluatePair(isFunctionTypeAnnotation, (target, originalSource) =>
    FunctionTypeAnnotationTypeClass.create(target, originalSource),
);

export const isFunctionTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionTypeAnnotationTypeClass => target instanceof FunctionTypeAnnotationTypeClass;
