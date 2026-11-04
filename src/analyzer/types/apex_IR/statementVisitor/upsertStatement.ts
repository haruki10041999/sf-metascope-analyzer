import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class UpsertStatementTypeClass extends DmlStatementTypeClass<
    'upsertStatement',
    BasedExpressionTypeClass
> {
    private key: QualifiedNameTypeClass | ApexErrorTypeClass | null = null;
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        key: QualifiedNameTypeClass | ApexErrorTypeClass | null,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('upsertStatement', value, accessLevel);
        this.key = key;
    }

    static create(ctx: UpsertStatementContext): UpsertStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UpsertStatementContext: ' + ctx.getText());
        }

        return new UpsertStatementTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            ctx.qualifiedName()
                ? isApexValidClass(
                      new NameVisitor().visit(ctx.qualifiedName()),
                      isQualifiedNameType,
                      'qualifiedName',
                  )
                : null,
            ctx.accessLevel()
                ? isApexValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }

    getKey(): QualifiedNameTypeClass | ApexErrorTypeClass | null {
        return this.key;
    }
}

export const isUpsertStatementType = (
    target: ApexCommonTypeClass<string>,
): target is UpsertStatementTypeClass => {
    return target instanceof UpsertStatementTypeClass;
};

