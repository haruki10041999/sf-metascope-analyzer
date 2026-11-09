import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isUpdateExpression, type UpdateExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import {
    parenthesizedExpressionTypePair,
    type ParenthesizedExpressionTypeClass,
} from './parenthesizedExpression';
import { tSAsExpressionTypePair, type TSAsExpressionTypeClass } from './tSAsExpression';
import {
    tSNonNullExpressionTypePair,
    type TSNonNullExpressionTypeClass,
} from './tSNonNullExpression';
import {
    tSSatisfiesExpressionTypePair,
    type TSSatisfiesExpressionTypeClass,
} from './tSSatisfiesExpression';
import { tSTypeAssertionTypePair, type TSTypeAssertionTypeClass } from './tSTypeAssertion';

/**
 * ++ / -- の対象。Babel の型は Identifier | MemberExpression だが、パーサは TS の `x!++`・`(x as T)++` や、
 * 括弧を残す設定 (createParenthesizedExpressions) の `(x)++` も作る
 */
const updateExpressionArgumentPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            tSNonNullExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            parenthesizedExpressionTypePair,
        ] as const,
);

export type UpdateExpressionFields = TypeField<'updateExpression'> & {
    prefix: UpdateExpression['prefix'];
    argument:
        | IdentifierTypeClass
        | MemberExpressionTypeClass
        | TSNonNullExpressionTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | ParenthesizedExpressionTypeClass;
    operator: UpdateExpression['operator'];
};

export class UpdateExpressionTypeClass extends LwcCommonTypeClass<
    'updateExpression',
    UpdateExpressionFields
> {
    private constructor(value: FieldsOf<UpdateExpressionFields>, sourceSpan: SourceSpan) {
        super('updateExpression', value, sourceSpan);
    }

    static create(target: UpdateExpression, originalSource: string): UpdateExpressionTypeClass {
        return new UpdateExpressionTypeClass(
            {
                prefix: target.prefix,
                argument: visitNode(
                    target.argument,
                    originalSource,
                    updateExpressionArgumentPairs(),
                    'UpdateExpression.argument',
                ),
                operator: target.operator,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getPrefix(): UpdateExpressionFields['prefix'] {
        return this.getFields().prefix;
    }

    getArgument(): UpdateExpressionFields['argument'] {
        return this.getFields().argument;
    }

    getOperator(): UpdateExpressionFields['operator'] {
        return this.getFields().operator;
    }
}

export const updateExpressionTypePair: EvaluatePair<UpdateExpression, UpdateExpressionTypeClass> =
    makeEvaluatePair(isUpdateExpression, (target, originalSource) =>
        UpdateExpressionTypeClass.create(target, originalSource),
    );

export const isUpdateExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is UpdateExpressionTypeClass => target instanceof UpdateExpressionTypeClass;
