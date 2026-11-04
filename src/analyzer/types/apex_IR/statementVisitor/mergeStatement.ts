import { MergeStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    StatementListTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class MergeStatementTypeClass extends StatementListTypeClass<
    'mergeStatement',
    BasedExpressionTypeClass
> {
    private accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null = null;
    private constructor(
        value: (BasedExpressionTypeClass | ApexErrorTypeClass)[],
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('mergeStatement', value);
        this.accessLevel = accessLevel;
    }

    static create(ctx: MergeStatementContext): MergeStatementTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。MergeStatementContext: ' + ctx.getText());
        }

        return new MergeStatementTypeClass(
            isApexValidClassList(
                ctx.expression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isBasedExpressionType,
                'expression',
            ),
            ctx.accessLevel()
                ? isApexValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }

    getAccessLevel(): AccessLevelTypeClass | ApexErrorTypeClass | null {
        return this.accessLevel;
    }
}

export const isMergeStatementType = (
    target: ApexCommonTypeClass<string>,
): target is MergeStatementTypeClass => {
    return target instanceof MergeStatementTypeClass;
};

