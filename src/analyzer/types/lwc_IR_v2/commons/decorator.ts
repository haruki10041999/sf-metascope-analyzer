import { isDecorator, type Decorator } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type DecoratorFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class DecoratorTypeClass extends LwcCommonTypeClass<'decorator'> {
    private readonly value: DecoratorFields;

    private constructor(value: DecoratorFields) {
        super('decorator');
        this.value = value;
    }

    static create(target: Decorator, originalSource: string): DecoratorTypeClass {
        return new DecoratorTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DecoratorFields {
        return this.value;
    }

    getExpression(): DecoratorFields['expression'] {
        return this.value.expression;
    }
}

export const decoratorTypePair: EvaluatePair<Decorator, DecoratorTypeClass> = makeEvaluatePair(
    isDecorator,
    (target, originalSource) => DecoratorTypeClass.create(target, originalSource),
);

export const isDecoratorType = (target: LwcCommonTypeClass<string>): target is DecoratorTypeClass =>
    target instanceof DecoratorTypeClass;
