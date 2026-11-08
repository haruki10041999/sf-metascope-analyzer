import { isMemberExpression, type MemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { superTypePair, type SuperTypeClass } from '../standardizedVisitor/super';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const memberExpressionObjectPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), superTypePair] as const,
);
const memberExpressionPropertyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);

export type MemberExpressionFields = {
    object: ExpressionTypeClass | SuperTypeClass | LwcErrorTypeClass;
    property: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    computed: MemberExpression['computed'];
};

export class MemberExpressionTypeClass extends LwcCommonTypeClass<'memberExpression'> {
    private readonly value: MemberExpressionFields;

    private constructor(value: MemberExpressionFields) {
        super('memberExpression');
        this.value = value;
    }

    static create(target: MemberExpression, originalSource: string): MemberExpressionTypeClass {
        return new MemberExpressionTypeClass({
            object: visitNode(
                target.object,
                originalSource,
                memberExpressionObjectPairs(),
                'MemberExpression.object',
            ),
            property: visitNode(
                target.property,
                originalSource,
                memberExpressionPropertyPairs(),
                'MemberExpression.property',
            ),
            computed: target.computed,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): MemberExpressionFields {
        return this.value;
    }

    getObject(): MemberExpressionFields['object'] {
        return this.value.object;
    }

    getProperty(): MemberExpressionFields['property'] {
        return this.value.property;
    }

    getComputed(): MemberExpressionFields['computed'] {
        return this.value.computed;
    }
}

export const memberExpressionTypePair: EvaluatePair<MemberExpression, MemberExpressionTypeClass> =
    makeEvaluatePair(isMemberExpression, (target, originalSource) =>
        MemberExpressionTypeClass.create(target, originalSource),
    );

export const isMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is MemberExpressionTypeClass => target instanceof MemberExpressionTypeClass;
