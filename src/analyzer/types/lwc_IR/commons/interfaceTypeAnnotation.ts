import { isInterfaceTypeAnnotation, type InterfaceTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InterfaceTypeAnnotationTypeClass extends LwcCommonTypeClass<'interfaceTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('interfaceTypeAnnotation', originalSource);
    }

    static create(
        target: InterfaceTypeAnnotation,
        originalSource: string,
    ): InterfaceTypeAnnotationTypeClass {
        throw new Error(
            'InterfaceTypeAnnotationTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const interfaceTypeAnnotationTypePair: EvaluatePair<
    InterfaceTypeAnnotation,
    InterfaceTypeAnnotationTypeClass
> = makeEvaluatePair(isInterfaceTypeAnnotation, (target, originalSource) =>
    InterfaceTypeAnnotationTypeClass.create(target, originalSource),
);

export const isInterfaceTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is InterfaceTypeAnnotationTypeClass => target instanceof InterfaceTypeAnnotationTypeClass;
