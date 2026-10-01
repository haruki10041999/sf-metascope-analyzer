import { MergeStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class MergeStatementTypeClass extends DmlStatementTypeClass<ExpressionTypeClass<unknown>[]> {
    private constructor(
        value: ExpressionTypeClass<unknown>[],
        accessLevel: AccessLevelTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('mergeStatement', value, accessLevel, errorClasses);
    }

    static create(ctx: MergeStatementContext): MergeStatementTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MergeStatementContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass<unknown>[] = [];
        let accessLevel: AccessLevelTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.expression_list().forEach((expressionCtx, index) => {
            const expressionTypeClass = new ExpressionVisitor().visit(expressionCtx);
            if (isExpressionTypeAll(expressionTypeClass)) {
                value.push(expressionTypeClass);
            } else if (isErrorType(expressionTypeClass)) {
                errorClasses[`value_${index}`] = expressionTypeClass;
            }
        });

        if (ctx.accessLevel()) {
            const accessLevelTypeClass = new StatementVisitor().visit(ctx.accessLevel());
            if (isAccessLevelType(accessLevelTypeClass)) {
                accessLevel = accessLevelTypeClass;
            } else if (isErrorType(accessLevelTypeClass)) {
                errorClasses['accessLevel'] = accessLevelTypeClass;
            }
        }

        return new MergeStatementTypeClass(value, accessLevel, errorClasses);
    }
}

export const isMergeStatementType = (
    target: CommonTypeClass,
): target is MergeStatementTypeClass => {
    return target instanceof MergeStatementTypeClass;
};

