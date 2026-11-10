import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassAccessorProperty, type ClassAccessorProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import {
    createClassPropertyAnnotation,
    createClassPropertyInit,
    type ClassMemberAnnotation,
    type ClassPropertyInit,
    type ClassPropertyTsModifiers,
} from './classProperty';
import { DecoratorTypeClass } from './decorator';
import {
    createMemberKey,
    staticMemberKeyOrPrivateNamePairs,
    type MemberKey,
    type StaticMemberKeyTypeClass,
} from './memberKey';
import { type PrivateNameTypeClass } from './privateName';

/**
 * `accessor x = v`。ClassProperty と同じ形で、computed でない側の key に PrivateName も入る
 * (Babel 8 の ClassAccessorPropertyNonComputed)
 */
export type ClassAccessorPropertyFields = TypeField<'classAccessorProperty'> &
    MemberKey<StaticMemberKeyTypeClass | PrivateNameTypeClass> & {
        static: ClassAccessorProperty['static'];
        decorators: DecoratorTypeClass[];
        init: ClassPropertyInit;
        annotation: ClassMemberAnnotation<ClassPropertyTsModifiers>;
    };

export class ClassAccessorPropertyTypeClass extends LwcCommonTypeClass<
    'classAccessorProperty',
    ClassAccessorPropertyFields
> {
    private constructor(value: FieldsOf<ClassAccessorPropertyFields>, sourceSpan: SourceSpan) {
        super('classAccessorProperty', value, sourceSpan);
    }

    static create(
        target: ClassAccessorProperty,
        originalSource: string,
    ): ClassAccessorPropertyTypeClass {
        return new ClassAccessorPropertyTypeClass(
            {
                ...createMemberKey(
                    target,
                    originalSource,
                    staticMemberKeyOrPrivateNamePairs(),
                    'ClassAccessorProperty',
                ),
                static: target.static,
                decorators: (target.decorators ?? []).map((child) =>
                    DecoratorTypeClass.create(child, originalSource),
                ),
                init: createClassPropertyInit(target, originalSource, 'ClassAccessorProperty'),
                annotation: createClassPropertyAnnotation(
                    target,
                    originalSource,
                    'ClassAccessorProperty',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getComputed(): ClassAccessorPropertyFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): ClassAccessorPropertyFields['key'] {
        return this.getFields().key;
    }

    getStatic(): ClassAccessorPropertyFields['static'] {
        return this.getFields().static;
    }

    getDecorators(): ClassAccessorPropertyFields['decorators'] {
        return this.getFields().decorators;
    }

    getInit(): ClassAccessorPropertyFields['init'] {
        return this.getFields().init;
    }

    getAnnotation(): ClassAccessorPropertyFields['annotation'] {
        return this.getFields().annotation;
    }
}

export const classAccessorPropertyTypePair: EvaluatePair<
    ClassAccessorProperty,
    ClassAccessorPropertyTypeClass
> = makeEvaluatePair(isClassAccessorProperty, (target, originalSource) =>
    ClassAccessorPropertyTypeClass.create(target, originalSource),
);

export const isClassAccessorPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassAccessorPropertyTypeClass => target instanceof ClassAccessorPropertyTypeClass;
