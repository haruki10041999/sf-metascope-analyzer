import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassImplements, type ClassImplements } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from '../commons/identifier';
import { TypeParameterInstantiationTypeClass } from './typeParameterInstantiation';

export type ClassImplementsFields = TypeField<'classImplements'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterInstantiationTypeClass | null;
};

export class ClassImplementsTypeClass extends LwcCommonTypeClass<
    'classImplements',
    ClassImplementsFields
> {
    private constructor(value: FieldsOf<ClassImplementsFields>, sourceSpan: SourceSpan) {
        super('classImplements', value, sourceSpan);
    }

    static create(target: ClassImplements, originalSource: string): ClassImplementsTypeClass {
        return new ClassImplementsTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterInstantiationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): ClassImplementsFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): ClassImplementsFields['typeParameters'] {
        return this.getFields().typeParameters;
    }
}

export const classImplementsTypePair: EvaluatePair<ClassImplements, ClassImplementsTypeClass> =
    makeEvaluatePair(isClassImplements, (target, originalSource) =>
        ClassImplementsTypeClass.create(target, originalSource),
    );

export const isClassImplementsType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassImplementsTypeClass => target instanceof ClassImplementsTypeClass;
