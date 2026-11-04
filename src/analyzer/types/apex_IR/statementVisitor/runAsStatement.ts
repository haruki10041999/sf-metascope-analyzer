import { RunAsStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class RunAsStatementTypeClass extends StatementTypeClass<
    'runAsStatement',
    ExpressionListTypeClass
> {
    private block: NormalBlockTypeClass | ApexErrorTypeClass;

    private constructor(
        value: ExpressionListTypeClass | ApexErrorTypeClass,
        block: NormalBlockTypeClass | ApexErrorTypeClass,
    ) {
        super('runAsStatement', value);
        this.block = block;
    }

    static create(ctx: RunAsStatementContext) {
        if (!ctx.block() || !ctx.expressionList()) {
            throw new Error('値が異常です。RunAsStatementContext: ' + ctx.getText());
        }

        return new RunAsStatementTypeClass(
            isApexValidClass(
                new ListVisitor().visit(ctx.expressionList()),
                isExpressionListType,
                'expressionList',
            ),
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock(): NormalBlockTypeClass | ApexErrorTypeClass {
        return this.block;
    }
}

export const isRunAsStatementType = (
    target: ApexCommonTypeClass<string>,
): target is RunAsStatementTypeClass => {
    return target instanceof RunAsStatementTypeClass;
};

