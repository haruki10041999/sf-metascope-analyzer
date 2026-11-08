import { isObjectPattern, type ObjectPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
import { objectPropertyTypePair, type ObjectPropertyTypeClass } from './objectProperty';
import { restElementTypePair, type RestElementTypeClass } from './restElement';

const objectPatternTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const objectPatternDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const objectPatternPropertiesPairs = lazyPairs(
    () => [restElementTypePair, objectPropertyTypePair] as const,
);

export type ObjectPatternFields = {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<ObjectPattern['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    properties: (RestElementTypeClass | ObjectPropertyTypeClass | LwcErrorTypeClass)[];
};

export class ObjectPatternTypeClass extends LwcCommonTypeClass<'objectPattern'> {
    private readonly value: ObjectPatternFields;

    private constructor(value: ObjectPatternFields) {
        super('objectPattern');
        this.value = value;
    }

    static create(target: ObjectPattern, originalSource: string): ObjectPatternTypeClass {
        return new ObjectPatternTypeClass({
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                objectPatternTypeAnnotationPairs(),
                'ObjectPattern.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          objectPatternDecoratorsPairs(),
                          'ObjectPattern.decorators',
                      ),
            properties: visitNodeList(
                target.properties,
                originalSource,
                objectPatternPropertiesPairs(),
                'ObjectPattern.properties',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectPatternFields {
        return this.value;
    }

    getTypeAnnotation(): ObjectPatternFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): ObjectPatternFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): ObjectPatternFields['decorators'] {
        return this.value.decorators;
    }

    getProperties(): ObjectPatternFields['properties'] {
        return this.value.properties;
    }
}

export const objectPatternTypePair: EvaluatePair<ObjectPattern, ObjectPatternTypeClass> =
    makeEvaluatePair(isObjectPattern, (target, originalSource) =>
        ObjectPatternTypeClass.create(target, originalSource),
    );

export const isObjectPatternType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectPatternTypeClass => target instanceof ObjectPatternTypeClass;
