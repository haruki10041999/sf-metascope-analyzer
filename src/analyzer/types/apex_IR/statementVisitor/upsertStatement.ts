import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class UpsertStatementTypeClass extends DmlStatementTypeClass<ExpressionAllTypeClass> {
    private key: QualifiedNameTypeClass | ErrorTypeClass | null = null;
    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
        key: QualifiedNameTypeClass | ErrorTypeClass | null,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('upsertStatement', value, accessLevel);
        this.key = key;
    }

    static create(ctx: UpsertStatementContext): UpsertStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UpsertStatementContext: ' + ctx.getText());
        }

        return new UpsertStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.qualifiedName()
                ? isValidClass(
                      new NameVisitor().visit(ctx.qualifiedName()),
                      isQualifiedNameType,
                      'qualifiedName',
                  )
                : null,
            ctx.accessLevel()
                ? isValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }

    getKey(): QualifiedNameTypeClass | ErrorTypeClass | null {
        return this.key;
    }
}

export const isUpsertStatementType = (
    target: CommonTypeClass,
): target is UpsertStatementTypeClass => {
    return target instanceof UpsertStatementTypeClass;
};

