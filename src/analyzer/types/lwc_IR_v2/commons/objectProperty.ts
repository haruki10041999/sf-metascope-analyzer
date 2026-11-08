import { isObjectProperty, type ObjectProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { patternLikeVisitorEvaluatePairs, type PatternLikeTypeClass } from '../patternLikeVisitor';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const objectPropertyKeyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);
const objectPropertyValuePairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), ...patternLikeVisitorEvaluatePairs()] as const,
);
const objectPropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);

export type ObjectPropertyFields = {
    computed: ObjectProperty['computed'];
    key: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    value: ExpressionTypeClass | PatternLikeTypeClass | LwcErrorTypeClass;
    shorthand: ObjectProperty['shorthand'];
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
};

export class ObjectPropertyTypeClass extends LwcCommonTypeClass<'objectProperty'> {
    private readonly value: ObjectPropertyFields;

    private constructor(value: ObjectPropertyFields) {
        super('objectProperty');
        this.value = value;
    }

    static create(target: ObjectProperty, originalSource: string): ObjectPropertyTypeClass {
        return new ObjectPropertyTypeClass({
            computed: target.computed,
            key: visitNode(
                target.key,
                originalSource,
                objectPropertyKeyPairs(),
                'ObjectProperty.key',
            ),
            value: visitNode(
                target.value,
                originalSource,
                objectPropertyValuePairs(),
                'ObjectProperty.value',
            ),
            shorthand: target.shorthand,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          objectPropertyDecoratorsPairs(),
                          'ObjectProperty.decorators',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectPropertyFields {
        return this.value;
    }

    getComputed(): ObjectPropertyFields['computed'] {
        return this.value.computed;
    }

    getKey(): ObjectPropertyFields['key'] {
        return this.value.key;
    }

    getValue(): ObjectPropertyFields['value'] {
        return this.value.value;
    }

    getShorthand(): ObjectPropertyFields['shorthand'] {
        return this.value.shorthand;
    }

    getDecorators(): ObjectPropertyFields['decorators'] {
        return this.value.decorators;
    }
}

export const objectPropertyTypePair: EvaluatePair<ObjectProperty, ObjectPropertyTypeClass> =
    makeEvaluatePair(isObjectProperty, (target, originalSource) =>
        ObjectPropertyTypeClass.create(target, originalSource),
    );

export const isObjectPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectPropertyTypeClass => target instanceof ObjectPropertyTypeClass;
