import { MergeStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    StatementListTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class MergeStatementTypeClass extends StatementListTypeClass<ExpressionAllTypeClass> {
    private accessLevel: AccessLevelTypeClass | ErrorTypeClass | null = null;
    private constructor(
        value: (ExpressionAllTypeClass | ErrorTypeClass)[],
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('mergeStatement', value);
        this.accessLevel = accessLevel;
    }

    static create(ctx: MergeStatementContext): MergeStatementTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MergeStatementContext: ' + ctx.getText());
        }

        return new MergeStatementTypeClass(
            isValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.accessLevel()
                ? isValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }

    getAccessLevel(): AccessLevelTypeClass | ErrorTypeClass | null {
        return this.accessLevel;
    }
}

export const isMergeStatementType = (
    target: CommonTypeClass,
): target is MergeStatementTypeClass => {
    return target instanceof MergeStatementTypeClass;
};

