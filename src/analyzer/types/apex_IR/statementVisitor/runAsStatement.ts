import { RunAsStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class RunAsStatementTypeClass extends StatementTypeClass<ExpressionListTypeClass> {
    private block: NormalBlockTypeClass | ErrorTypeClass;

    private constructor(
        value: ExpressionListTypeClass | ErrorTypeClass,
        block: NormalBlockTypeClass | ErrorTypeClass,
    ) {
        super('runAsStatement', value);
        this.block = block;
    }

    static create(ctx: RunAsStatementContext) {
        if (!ctx.block() || !ctx.expressionList()) {
            throw new Error('値が異常です。RunAsStatementContext: ' + ctx.getText());
        }

        return new RunAsStatementTypeClass(
            isValidClass(
                new ListVisitor().visit(ctx.expressionList()),
                isExpressionListType,
                'expressionList',
            ),
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock(): NormalBlockTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isRunAsStatementType = (
    target: CommonTypeClass,
): target is RunAsStatementTypeClass => {
    return target instanceof RunAsStatementTypeClass;
};
