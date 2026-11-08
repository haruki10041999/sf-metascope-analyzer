import { isInterfaceTypeAnnotation, type InterfaceTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import {
    interfaceExtendsTypePair,
    type InterfaceExtendsTypeClass,
} from '../flowVisitor/interfaceExtends';
import {
    objectTypeAnnotationTypePair,
    type ObjectTypeAnnotationTypeClass,
} from './objectTypeAnnotation';

const interfaceTypeAnnotationExtendsPairs = lazyPairs(() => [interfaceExtendsTypePair] as const);
const interfaceTypeAnnotationBodyPairs = lazyPairs(() => [objectTypeAnnotationTypePair] as const);

export type InterfaceTypeAnnotationFields = {
    extends: (InterfaceExtendsTypeClass | LwcErrorTypeClass)[] | null;
    body: ObjectTypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class InterfaceTypeAnnotationTypeClass extends LwcCommonTypeClass<'interfaceTypeAnnotation'> {
    private readonly value: InterfaceTypeAnnotationFields;

    private constructor(value: InterfaceTypeAnnotationFields) {
        super('interfaceTypeAnnotation');
        this.value = value;
    }

    static create(
        target: InterfaceTypeAnnotation,
        originalSource: string,
    ): InterfaceTypeAnnotationTypeClass {
        return new InterfaceTypeAnnotationTypeClass({
            extends:
                target.extends == null
                    ? null
                    : visitNodeList(
                          target.extends,
                          originalSource,
                          interfaceTypeAnnotationExtendsPairs(),
                          'InterfaceTypeAnnotation.extends',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                interfaceTypeAnnotationBodyPairs(),
                'InterfaceTypeAnnotation.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): InterfaceTypeAnnotationFields {
        return this.value;
    }

    getExtends(): InterfaceTypeAnnotationFields['extends'] {
        return this.value.extends;
    }

    getBody(): InterfaceTypeAnnotationFields['body'] {
        return this.value.body;
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
