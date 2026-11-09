import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isInterfaceTypeAnnotation, type InterfaceTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { InterfaceExtendsTypeClass } from '../flowVisitor/interfaceExtends';
import { ObjectTypeAnnotationTypeClass } from './objectTypeAnnotation';

export type InterfaceTypeAnnotationFields = TypeField<'interfaceTypeAnnotation'> & {
    extends: InterfaceExtendsTypeClass[] | null;
    body: ObjectTypeAnnotationTypeClass;
};

export class InterfaceTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'interfaceTypeAnnotation',
    InterfaceTypeAnnotationFields
> {
    private constructor(value: FieldsOf<InterfaceTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('interfaceTypeAnnotation', value, sourceSpan);
    }

    static create(
        target: InterfaceTypeAnnotation,
        originalSource: string,
    ): InterfaceTypeAnnotationTypeClass {
        return new InterfaceTypeAnnotationTypeClass(
            {
                extends:
                    target.extends == null
                        ? null
                        : target.extends.map((child) =>
                              InterfaceExtendsTypeClass.create(child, originalSource),
                          ),
                body: ObjectTypeAnnotationTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExtends(): InterfaceTypeAnnotationFields['extends'] {
        return this.getFields().extends;
    }

    getBody(): InterfaceTypeAnnotationFields['body'] {
        return this.getFields().body;
    }
}

export const interfaceTypeAnnotationTypePair: EvaluatePair<
    InterfaceTypeAnnotation,
    InterfaceTypeAnnotationTypeClass
> = makeEvaluatePair(isInterfaceTypeAnnotation, (target, originalSource) =>
    InterfaceTypeAnnotationTypeClass.create(target, originalSource),
);

export const isInterfaceTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is InterfaceTypeAnnotationTypeClass => target instanceof InterfaceTypeAnnotationTypeClass;
