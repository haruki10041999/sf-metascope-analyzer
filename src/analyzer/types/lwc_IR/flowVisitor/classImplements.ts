import { isClassImplements, type ClassImplements } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from './typeParameterInstantiation';

const classImplementsIdPairs = lazyPairs(() => [identifierTypePair] as const);
const classImplementsTypeParametersPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair] as const,
);

export type ClassImplementsFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class ClassImplementsTypeClass extends LwcCommonTypeClass<'classImplements'> {
    private readonly value: ClassImplementsFields;

    private constructor(value: ClassImplementsFields) {
        super('classImplements');
        this.value = value;
    }

    static create(target: ClassImplements, originalSource: string): ClassImplementsTypeClass {
        return new ClassImplementsTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                classImplementsIdPairs(),
                'ClassImplements.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                classImplementsTypeParametersPairs(),
                'ClassImplements.typeParameters',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassImplementsFields {
        return this.value;
    }

    getId(): ClassImplementsFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): ClassImplementsFields['typeParameters'] {
        return this.value.typeParameters;
    }
}

export const classImplementsTypePair: EvaluatePair<ClassImplements, ClassImplementsTypeClass> =
    makeEvaluatePair(isClassImplements, (target, originalSource) =>
        ClassImplementsTypeClass.create(target, originalSource),
    );

export const isClassImplementsType = (
    target: LwcCommonTypeClass<string>,
): target is ClassImplementsTypeClass => target instanceof ClassImplementsTypeClass;
