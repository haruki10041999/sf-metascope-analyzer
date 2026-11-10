import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectPattern, isRestElement, type ObjectPattern } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { DecoratorTypeClass } from './decorator';
import { objectPropertyTypePair, type ObjectPropertyTypeClass } from './objectProperty';
import { RestElementTypeClass } from './restElement';

const objectPatternTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const objectPatternPropertiesPairs = lazyPairs(() => [objectPropertyTypePair] as const);

export type ObjectPatternFields = TypeField<'objectPattern'> & {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
    properties: ObjectPropertyTypeClass[];
    /** 残りのプロパティ (`{ a, ...rest }` の `...rest`)。最後に 1 個まで */
    rest: RestElementTypeClass | null;
};

export class ObjectPatternTypeClass extends LwcCommonTypeClass<
    'objectPattern',
    ObjectPatternFields
> {
    private constructor(value: FieldsOf<ObjectPatternFields>, sourceSpan: SourceSpan) {
        super('objectPattern', value, sourceSpan);
    }

    static create(target: ObjectPattern, originalSource: string): ObjectPatternTypeClass {
        const last = target.properties.at(-1);
        const rest = last != null && isRestElement(last) ? last : null;
        const properties = rest == null ? target.properties : target.properties.slice(0, -1);
        if (properties.some((property) => isRestElement(property))) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'オブジェクトのパターンの rest は最後に 1 個までです',
            );
        }
        return new ObjectPatternTypeClass(
            {
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    objectPatternTypeAnnotationPairs(),
                    'ObjectPattern.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                properties: visitNodeList(
                    properties,
                    originalSource,
                    objectPatternPropertiesPairs(),
                    'ObjectPattern.properties',
                ),
                rest: rest == null ? null : RestElementTypeClass.create(rest, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): ObjectPatternFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): ObjectPatternFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): ObjectPatternFields['decorators'] {
        return this.getFields().decorators;
    }

    getProperties(): ObjectPatternFields['properties'] {
        return this.getFields().properties;
    }

    getRest(): ObjectPatternFields['rest'] {
        return this.getFields().rest;
    }
}

export const objectPatternTypePair: EvaluatePair<ObjectPattern, ObjectPatternTypeClass> =
    makeEvaluatePair(isObjectPattern, (target, originalSource) =>
        ObjectPatternTypeClass.create(target, originalSource),
    );

export const isObjectPatternType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectPatternTypeClass => target instanceof ObjectPatternTypeClass;
