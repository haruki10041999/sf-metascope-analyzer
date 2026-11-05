import { isUpdateExpression, type UpdateExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';

const updateExpressionArgumentPairs = lazyPairs(
    () => [identifierTypePair, memberExpressionTypePair] as const,
);

export type UpdateExpressionFields = {
    prefix: UpdateExpression['prefix'];
    argument: IdentifierTypeClass | MemberExpressionTypeClass | LwcErrorTypeClass;
    operator: UpdateExpression['operator'];
};

export class UpdateExpressionTypeClass extends LwcCommonTypeClass<'updateExpression'> {
    private readonly value: UpdateExpressionFields;

    private constructor(value: UpdateExpressionFields) {
        super('updateExpression');
        this.value = value;
    }

    static create(target: UpdateExpression, originalSource: string): UpdateExpressionTypeClass {
        return new UpdateExpressionTypeClass({
            prefix: target.prefix,
            argument: visitNode(
                target.argument,
                originalSource,
                updateExpressionArgumentPairs(),
                'UpdateExpression.argument',
            ),
            operator: target.operator,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): UpdateExpressionFields {
        return this.value;
    }

    getPrefix(): UpdateExpressionFields['prefix'] {
        return this.value.prefix;
    }

    getArgument(): UpdateExpressionFields['argument'] {
        return this.value.argument;
    }

    getOperator(): UpdateExpressionFields['operator'] {
        return this.value.operator;
    }
}

export const updateExpressionTypePair: EvaluatePair<UpdateExpression, UpdateExpressionTypeClass> =
    makeEvaluatePair(isUpdateExpression, (target, originalSource) =>
        UpdateExpressionTypeClass.create(target, originalSource),
    );

export const isUpdateExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is UpdateExpressionTypeClass => target instanceof UpdateExpressionTypeClass;
