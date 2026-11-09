import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDecorator, type Decorator } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { callExpressionTypePair, type CallExpressionTypeClass } from './callExpression';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import {
    parenthesizedExpressionTypePair,
    type ParenthesizedExpressionTypeClass,
} from './parenthesizedExpression';

/** デコレーターに書ける式 (`@a`・`@a.b`・`@a(...)`・`@(expr)`)。ほかの式は文法上書けない */
const decoratorExpressionPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            callExpressionTypePair,
            parenthesizedExpressionTypePair,
        ] as const,
);

/**
 * kind でデコレーターの形を見分ける (`@api` は identifier、`@wire(adapter, config)` は call)。
 * 括弧はノードになる (parser/Lwc/script.ts の createParenthesizedExpressions) ので、`@(expr)` は parenthesized
 */
export type DecoratorFields = TypeField<'decorator'> &
    (
        | { kind: 'identifier'; expression: IdentifierTypeClass }
        | { kind: 'member'; expression: MemberExpressionTypeClass }
        | { kind: 'call'; expression: CallExpressionTypeClass }
        | { kind: 'parenthesized'; expression: ParenthesizedExpressionTypeClass }
    );

export class DecoratorTypeClass extends LwcCommonTypeClass<'decorator', DecoratorFields> {
    private constructor(value: FieldsOf<DecoratorFields>, sourceSpan: SourceSpan) {
        super('decorator', value, sourceSpan);
    }

    static create(target: Decorator, originalSource: string): DecoratorTypeClass {
        const expression = visitNode(
            target.expression,
            originalSource,
            decoratorExpressionPairs(),
            'Decorator.expression',
        );
        const span = getSourceSpan(target, originalSource);
        switch (expression.kind) {
            case 'identifier':
                return new DecoratorTypeClass({ kind: 'identifier', expression }, span);
            case 'memberExpression':
                return new DecoratorTypeClass({ kind: 'member', expression }, span);
            case 'callExpression':
                return new DecoratorTypeClass({ kind: 'call', expression }, span);
            case 'parenthesizedExpression':
                return new DecoratorTypeClass({ kind: 'parenthesized', expression }, span);
        }
    }

    getKind(): DecoratorFields['kind'] {
        return this.getFields().kind;
    }

    getExpression(): DecoratorFields['expression'] {
        return this.getFields().expression;
    }
}

export const decoratorTypePair: EvaluatePair<Decorator, DecoratorTypeClass> = makeEvaluatePair(
    isDecorator,
    (target, originalSource) => DecoratorTypeClass.create(target, originalSource),
);

export const isDecoratorType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DecoratorTypeClass => target instanceof DecoratorTypeClass;
