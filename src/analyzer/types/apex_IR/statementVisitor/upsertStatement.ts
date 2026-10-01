import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class UpsertStatementTypeClass extends DmlStatementTypeClass<ExpressionTypeClass<unknown>> {
    private key: QualifiedNameTypeClass | null = null;
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        key: QualifiedNameTypeClass | null,
        accessLevel: AccessLevelTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('upsertStatement', value, accessLevel, errorClasses);
        this.key = key;
    }

    static create(ctx: UpsertStatementContext): UpsertStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UpsertStatementContext: ' + ctx.getText());
        }

        let value: ExpressionTypeClass<unknown> | null = null;
        let key: QualifiedNameTypeClass | null = null;
        let accessLevel: AccessLevelTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else if (isErrorType(expressionTypeClass)) {
            errorClasses['expression'] = expressionTypeClass;
        }

        if (ctx.qualifiedName()) {
            const nameTypeClass = new NameVisitor().visit(ctx.qualifiedName());
            if (isQualifiedNameType(nameTypeClass)) {
                key = nameTypeClass;
            } else if (isErrorType(nameTypeClass)) {
                errorClasses['key'] = nameTypeClass;
            }
        }

        if (ctx.accessLevel()) {
            const accessLevelTypeClass = new StatementVisitor().visit(ctx.accessLevel());
            if (isAccessLevelType(accessLevelTypeClass)) {
                accessLevel = accessLevelTypeClass;
            } else if (isErrorType(accessLevelTypeClass)) {
                errorClasses['accessLevel'] = accessLevelTypeClass;
            }
        }

        return new UpsertStatementTypeClass(value, key, accessLevel, errorClasses);
    }
}

export const isUpsertStatementType = (
    target: CommonTypeClass,
): target is UpsertStatementTypeClass => {
    return target instanceof UpsertStatementTypeClass;
};

