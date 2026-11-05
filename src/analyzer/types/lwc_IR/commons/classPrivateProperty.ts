import { isClassPrivateProperty, type ClassPrivateProperty } from '@babel/types';
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

const classPrivatePropertyKeyPairs = lazyPairs(() => [privateNameTypePair] as const);
const classPrivatePropertyTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const classPrivatePropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const classPrivatePropertyVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type ClassPrivatePropertyFields = {
    key: PrivateNameTypeClass | LwcErrorTypeClass;
    value: ExpressionTypeClass | LwcErrorTypeClass | null;
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    static: ClassPrivateProperty['static'];
    readonly: NonNullable<ClassPrivateProperty['readonly']> | null;
    optional: NonNullable<ClassPrivateProperty['optional']> | null;
    definite: NonNullable<ClassPrivateProperty['definite']> | null;
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
};

export class ClassPrivatePropertyTypeClass extends LwcCommonTypeClass<'classPrivateProperty'> {
    private readonly value: ClassPrivatePropertyFields;

    private constructor(value: ClassPrivatePropertyFields) {
        super('classPrivateProperty');
        this.value = value;
    }

    static create(
        target: ClassPrivateProperty,
        originalSource: string,
    ): ClassPrivatePropertyTypeClass {
        return new ClassPrivatePropertyTypeClass({
            key: visitNode(
                target.key,
                originalSource,
                classPrivatePropertyKeyPairs(),
                'ClassPrivateProperty.key',
            ),
            value: visitOptionalNode(
                target.value,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                classPrivatePropertyTypeAnnotationPairs(),
                'ClassPrivateProperty.typeAnnotation',
            ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          classPrivatePropertyDecoratorsPairs(),
                          'ClassPrivateProperty.decorators',
                      ),
            static: target.static,
            readonly: target.readonly ?? null,
            optional: target.optional ?? null,
            definite: target.definite ?? null,
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                classPrivatePropertyVariancePairs(),
                'ClassPrivateProperty.variance',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassPrivatePropertyFields {
        return this.value;
    }

    getKey(): ClassPrivatePropertyFields['key'] {
        return this.value.key;
    }

    getValue(): ClassPrivatePropertyFields['value'] {
        return this.value.value;
    }

    getTypeAnnotation(): ClassPrivatePropertyFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getDecorators(): ClassPrivatePropertyFields['decorators'] {
        return this.value.decorators;
    }

    getStatic(): ClassPrivatePropertyFields['static'] {
        return this.value.static;
    }

    getReadonly(): ClassPrivatePropertyFields['readonly'] {
        return this.value.readonly;
    }

    getOptional(): ClassPrivatePropertyFields['optional'] {
        return this.value.optional;
    }

    getDefinite(): ClassPrivatePropertyFields['definite'] {
        return this.value.definite;
    }

    getVariance(): ClassPrivatePropertyFields['variance'] {
        return this.value.variance;
    }
}

export const classPrivatePropertyTypePair: EvaluatePair<
    ClassPrivateProperty,
    ClassPrivatePropertyTypeClass
> = makeEvaluatePair(isClassPrivateProperty, (target, originalSource) =>
    ClassPrivatePropertyTypeClass.create(target, originalSource),
);

export const isClassPrivatePropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ClassPrivatePropertyTypeClass => target instanceof ClassPrivatePropertyTypeClass;
