import { isClassAccessorProperty, type ClassAccessorProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import { varianceTypePair, type VarianceTypeClass } from '../flowVisitor/variance';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const classAccessorPropertyKeyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);
const classAccessorPropertyTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classAccessorPropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classAccessorPropertyVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type ClassAccessorPropertyFields = {
    abstract: NonNullable<ClassAccessorProperty['abstract']> | null;
    accessibility: NonNullable<ClassAccessorProperty['accessibility']> | null;
    static: ClassAccessorProperty['static'];
    override: NonNullable<ClassAccessorProperty['override']> | null;
    computed: ClassAccessorProperty['computed'];
    optional: NonNullable<ClassAccessorProperty['optional']> | null;
    key: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    value: ExpressionTypeClass | LwcErrorTypeClass | null;
    definite: NonNullable<ClassAccessorProperty['definite']> | null;
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    readonly: NonNullable<ClassAccessorProperty['readonly']> | null;
    declare: NonNullable<ClassAccessorProperty['declare']> | null;
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
};

export class ClassAccessorPropertyTypeClass extends LwcCommonTypeClass<'classAccessorProperty'> {
    private readonly value: ClassAccessorPropertyFields;

    private constructor(value: ClassAccessorPropertyFields) {
        super('classAccessorProperty');
        this.value = value;
    }

    static create(
        target: ClassAccessorProperty,
        originalSource: string,
    ): ClassAccessorPropertyTypeClass {
        return new ClassAccessorPropertyTypeClass({
            abstract: target.abstract ?? null,
            accessibility: target.accessibility ?? null,
            static: target.static,
            override: target.override ?? null,
            computed: target.computed,
            optional: target.optional ?? null,
            key: visitNode(
                target.key,
                originalSource,
                classAccessorPropertyKeyPairs(),
                'ClassAccessorProperty.key',
            ),
            value: visitOptionalNode(
                target.value,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            definite: target.definite ?? null,
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                classAccessorPropertyTypeAnnotationPairs(),
                'ClassAccessorProperty.typeAnnotation',
            ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classAccessorPropertyDecoratorsPairs(),
                          'ClassAccessorProperty.decorators',
                      ),
            readonly: target.readonly ?? null,
            declare: target.declare ?? null,
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                classAccessorPropertyVariancePairs(),
                'ClassAccessorProperty.variance',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassAccessorPropertyFields {
        return this.value;
    }

    getAbstract(): ClassAccessorPropertyFields['abstract'] {
        return this.value.abstract;
    }

    getAccessibility(): ClassAccessorPropertyFields['accessibility'] {
        return this.value.accessibility;
    }

    getStatic(): ClassAccessorPropertyFields['static'] {
        return this.value.static;
    }

    getOverride(): ClassAccessorPropertyFields['override'] {
        return this.value.override;
    }

    getComputed(): ClassAccessorPropertyFields['computed'] {
        return this.value.computed;
    }

    getOptional(): ClassAccessorPropertyFields['optional'] {
        return this.value.optional;
    }

    getKey(): ClassAccessorPropertyFields['key'] {
        return this.value.key;
    }

    getValue(): ClassAccessorPropertyFields['value'] {
        return this.value.value;
    }

    getDefinite(): ClassAccessorPropertyFields['definite'] {
        return this.value.definite;
    }

    getTypeAnnotation(): ClassAccessorPropertyFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getDecorators(): ClassAccessorPropertyFields['decorators'] {
        return this.value.decorators;
    }

    getReadonly(): ClassAccessorPropertyFields['readonly'] {
        return this.value.readonly;
    }

    getDeclare(): ClassAccessorPropertyFields['declare'] {
        return this.value.declare;
    }

    getVariance(): ClassAccessorPropertyFields['variance'] {
        return this.value.variance;
    }
}

export const classAccessorPropertyTypePair: EvaluatePair<
    ClassAccessorProperty,
    ClassAccessorPropertyTypeClass
> = makeEvaluatePair(isClassAccessorProperty, (target, originalSource) =>
    ClassAccessorPropertyTypeClass.create(target, originalSource),
);

export const isClassAccessorPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassAccessorPropertyTypeClass => target instanceof ClassAccessorPropertyTypeClass;
