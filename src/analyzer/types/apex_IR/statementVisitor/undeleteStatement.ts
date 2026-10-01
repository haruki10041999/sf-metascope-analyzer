import { UndeleteStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class UndeleteStatementTypeClass extends DmlStatementTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        accessLevel: AccessLevelTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('undeleteStatement', value, accessLevel, errorClasses);
    }

    static create(ctx: UndeleteStatementContext): UndeleteStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UndeleteStatementContext: ' + ctx.getText());
        }

        let value: ExpressionTypeClass<unknown> | null = null;
        let accessLevel: AccessLevelTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else if (isErrorType(expressionTypeClass)) {
            errorClasses['expression'] = expressionTypeClass;
        }

        if (ctx.accessLevel()) {
            const accessLevelTypeClass = new StatementVisitor().visit(ctx.accessLevel());
            if (isAccessLevelType(accessLevelTypeClass)) {
                accessLevel = accessLevelTypeClass;
            } else if (isErrorType(accessLevelTypeClass)) {
                errorClasses['accessLevel'] = accessLevelTypeClass;
            }
        }

        return new UndeleteStatementTypeClass(value, accessLevel, errorClasses);
    }
}

export const isUndeleteStatementType = (
    target: CommonTypeClass,
): target is UndeleteStatementTypeClass => {
    return target instanceof UndeleteStatementTypeClass;
};

