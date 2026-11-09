import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassPrivateProperty, type ClassPrivateProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs } from '../expressionVisitor';
import {
    createClassMemberAnnotation,
    type ClassMemberAnnotation,
    type ClassPropertyInit,
} from './classProperty';
import { DecoratorTypeClass } from './decorator';
import { failUnsupported } from './memberKey';
import { PrivateNameTypeClass } from './privateName';

/** `#x` の初期化。declare・abstract は付けられないので、ClassPropertyInit の value・none (abstract なし)・definite だけ */
export type ClassPrivatePropertyInit =
    | Extract<ClassPropertyInit, { kind: 'value' | 'definite' }>
    | { kind: 'none'; optional: boolean };

/** `#x` の TS の修飾子 (アクセス修飾子は付けられない) */
export type ClassPrivatePropertyTsModifiers = {
    readonly: boolean;
};

export type ClassPrivatePropertyFields = TypeField<'classPrivateProperty'> & {
    key: PrivateNameTypeClass;
    static: ClassPrivateProperty['static'];
    decorators: DecoratorTypeClass[];
    init: ClassPrivatePropertyInit;
    annotation: ClassMemberAnnotation<ClassPrivatePropertyTsModifiers>;
};

const createClassPrivatePropertyInit = (
    target: ClassPrivateProperty,
    originalSource: string,
): ClassPrivatePropertyInit => {
    const optional = target.optional ?? false;
    if (target.definite) {
        if (target.value != null || optional) {
            return failUnsupported(
                target,
                originalSource,
                'ClassPrivateProperty: definite に value・optional は付けられません',
            );
        }
        return { kind: 'definite' };
    }
    if (target.value != null) {
        return {
            kind: 'value',
            value: visitNode(
                target.value,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ClassPrivateProperty.value',
            ),
            optional,
        };
    }
    return { kind: 'none', optional };
};

export class ClassPrivatePropertyTypeClass extends LwcCommonTypeClass<
    'classPrivateProperty',
    ClassPrivatePropertyFields
> {
    private constructor(value: FieldsOf<ClassPrivatePropertyFields>, sourceSpan: SourceSpan) {
        super('classPrivateProperty', value, sourceSpan);
    }

    static create(
        target: ClassPrivateProperty,
        originalSource: string,
    ): ClassPrivatePropertyTypeClass {
        const readonly = target.readonly ?? false;
        return new ClassPrivatePropertyTypeClass(
            {
                key: PrivateNameTypeClass.create(target.key, originalSource),
                static: target.static,
                decorators: (target.decorators ?? []).map((child) =>
                    DecoratorTypeClass.create(child, originalSource),
                ),
                init: createClassPrivatePropertyInit(target, originalSource),
                annotation: createClassMemberAnnotation(
                    target,
                    originalSource,
                    'ClassPrivateProperty',
                    { readonly },
                    readonly || Boolean(target.definite) || Boolean(target.optional),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKey(): ClassPrivatePropertyFields['key'] {
        return this.getFields().key;
    }

    getStatic(): ClassPrivatePropertyFields['static'] {
        return this.getFields().static;
    }

    getDecorators(): ClassPrivatePropertyFields['decorators'] {
        return this.getFields().decorators;
    }

    getInit(): ClassPrivatePropertyFields['init'] {
        return this.getFields().init;
    }

    getAnnotation(): ClassPrivatePropertyFields['annotation'] {
        return this.getFields().annotation;
    }
}

export const classPrivatePropertyTypePair: EvaluatePair<
    ClassPrivateProperty,
    ClassPrivatePropertyTypeClass
> = makeEvaluatePair(isClassPrivateProperty, (target, originalSource) =>
    ClassPrivatePropertyTypeClass.create(target, originalSource),
);

export const isClassPrivatePropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassPrivatePropertyTypeClass => target instanceof ClassPrivatePropertyTypeClass;
