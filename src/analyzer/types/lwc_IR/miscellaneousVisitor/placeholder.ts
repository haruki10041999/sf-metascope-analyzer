import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isPlaceholder, type Placeholder } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { DecoratorTypeClass } from '../commons/decorator';
import { IdentifierTypeClass } from '../commons/identifier';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';

const placeholderTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);

export type PlaceholderFields = TypeField<'placeholder'> & {
    name: IdentifierTypeClass;
    expectedNode: Placeholder['expectedNode'];
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
};

export class PlaceholderTypeClass extends LwcCommonTypeClass<'placeholder', PlaceholderFields> {
    private constructor(value: FieldsOf<PlaceholderFields>, sourceSpan: SourceSpan) {
        super('placeholder', value, sourceSpan);
    }

    static create(target: Placeholder, originalSource: string): PlaceholderTypeClass {
        return new PlaceholderTypeClass(
            {
                name: IdentifierTypeClass.create(target.name, originalSource),
                expectedNode: target.expectedNode,
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    placeholderTypeAnnotationPairs(),
                    'Placeholder.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): PlaceholderFields['name'] {
        return this.getFields().name;
    }

    getExpectedNode(): PlaceholderFields['expectedNode'] {
        return this.getFields().expectedNode;
    }

    getTypeAnnotation(): PlaceholderFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): PlaceholderFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): PlaceholderFields['decorators'] {
        return this.getFields().decorators;
    }
}

export const placeholderTypePair: EvaluatePair<Placeholder, PlaceholderTypeClass> =
    makeEvaluatePair(isPlaceholder, (target, originalSource) =>
        PlaceholderTypeClass.create(target, originalSource),
    );

export const isPlaceholderType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is PlaceholderTypeClass => target instanceof PlaceholderTypeClass;
