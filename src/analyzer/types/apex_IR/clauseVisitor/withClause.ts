import { WithClauseContext } from '@apexdevtools/apex-parser';

import { LogicalExpressionTypeClass, FilteringExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** filter があるのは DATA_CATEGORY のときだけ。EXPRESSION は `WITH 式` */
export type WithClauseType = TypeField<'withClause'> &
    (
        | { kind: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED' }
        | { kind: 'DATA_CATEGORY'; filter: FilteringExpressionTypeClass }
        | { kind: 'EXPRESSION'; expression: LogicalExpressionTypeClass }
    );

export class WithClauseTypeClass extends ApexCommonTypeClass<'withClause', WithClauseType> {
    private constructor(fields: FieldsOf<WithClauseType>, sourceSpan: SourceSpan) {
        super('withClause', fields, sourceSpan);
    }

    static create(ctx: WithClauseContext): WithClauseTypeClass {
        return new WithClauseTypeClass(WithClauseTypeClass.createFields(ctx), getSourceSpan(ctx));
    }

    private static createFields(ctx: WithClauseContext): FieldsOf<WithClauseType> {
        if (ctx.SYSTEM_MODE()) {
            return { kind: 'SYSTEM_MODE' };
        } else if (ctx.USER_MODE()) {
            return { kind: 'USER_MODE' };
        } else if (ctx.SECURITY_ENFORCED()) {
            return { kind: 'SECURITY_ENFORCED' };
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            return {
                kind: 'DATA_CATEGORY',
                filter: createNode(
                    ctx.filteringExpression(),
                    (c) => FilteringExpressionTypeClass.create(c),
                    'filteringExpression',
                ),
            };
        } else if (ctx.logicalExpression()) {
            return {
                kind: 'EXPRESSION',
                expression: createNode(
                    ctx.logicalExpression(),
                    (c) => LogicalExpressionTypeClass.create(c),
                    'logicalExpression',
                ),
            };
        }
        throw new Error('値が異常です。WithClauseContext: ' + ctx.getText());
    }

    getKind(): WithClauseType['kind'] {
        return this.getFields().kind;
    }
}

export const isWithClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WithClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('withClause', target);
};
