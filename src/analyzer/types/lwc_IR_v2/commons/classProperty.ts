import { isClassProperty, type ClassProperty } from '@babel/types';
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

const classPropertyKeyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);
const classPropertyTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classPropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classPropertyVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type ClassPropertyFields = {
    abstract: NonNullable<ClassProperty['abstract']> | null;
    accessibility: NonNullable<ClassProperty['accessibility']> | null;
    static: ClassProperty['static'];
    override: NonNullable<ClassProperty['override']> | null;
    computed: ClassProperty['computed'];
    optional: NonNullable<ClassProperty['optional']> | null;
    key: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    value: ExpressionTypeClass | LwcErrorTypeClass | null;
    definite: NonNullable<ClassProperty['definite']> | null;
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    readonly: NonNullable<ClassProperty['readonly']> | null;
    declare: NonNullable<ClassProperty['declare']> | null;
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
};

export class ClassPropertyTypeClass extends LwcCommonTypeClass<'classProperty'> {
    private readonly value: ClassPropertyFields;

    private constructor(value: ClassPropertyFields) {
        super('classProperty');
        this.value = value;
    }

    static create(target: ClassProperty, originalSource: string): ClassPropertyTypeClass {
        return new ClassPropertyTypeClass({
            abstract: target.abstract ?? null,
            accessibility: target.accessibility ?? null,
            static: target.static,
            override: target.override ?? null,
            computed: target.computed,
            optional: target.optional ?? null,
            key: visitNode(
                target.key,
                originalSource,
                classPropertyKeyPairs(),
                'ClassProperty.key',
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
                classPropertyTypeAnnotationPairs(),
                'ClassProperty.typeAnnotation',
            ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classPropertyDecoratorsPairs(),
                          'ClassProperty.decorators',
                      ),
            readonly: target.readonly ?? null,
            declare: target.declare ?? null,
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                classPropertyVariancePairs(),
                'ClassProperty.variance',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassPropertyFields {
        return this.value;
    }

    getAbstract(): ClassPropertyFields['abstract'] {
        return this.value.abstract;
    }

    getAccessibility(): ClassPropertyFields['accessibility'] {
        return this.value.accessibility;
    }

    getStatic(): ClassPropertyFields['static'] {
        return this.value.static;
    }

    getOverride(): ClassPropertyFields['override'] {
        return this.value.override;
    }

    getComputed(): ClassPropertyFields['computed'] {
        return this.value.computed;
    }

    getOptional(): ClassPropertyFields['optional'] {
        return this.value.optional;
    }

    getKey(): ClassPropertyFields['key'] {
        return this.value.key;
    }

    getValue(): ClassPropertyFields['value'] {
        return this.value.value;
    }

    getDefinite(): ClassPropertyFields['definite'] {
        return this.value.definite;
    }

    getTypeAnnotation(): ClassPropertyFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getDecorators(): ClassPropertyFields['decorators'] {
        return this.value.decorators;
    }

    getReadonly(): ClassPropertyFields['readonly'] {
        return this.value.readonly;
    }

    getDeclare(): ClassPropertyFields['declare'] {
        return this.value.declare;
    }

    getVariance(): ClassPropertyFields['variance'] {
        return this.value.variance;
    }
}

export const classPropertyTypePair: EvaluatePair<ClassProperty, ClassPropertyTypeClass> =
    makeEvaluatePair(isClassProperty, (target, originalSource) =>
        ClassPropertyTypeClass.create(target, originalSource),
    );

export const isClassPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPropertyTypeClass => target instanceof ClassPropertyTypeClass;
