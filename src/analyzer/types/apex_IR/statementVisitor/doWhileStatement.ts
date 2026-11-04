import { DoWhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import {
    ParExpressionTypeClass,
    ExpressionVisitor,
    isParExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class DoWhileStatementTypeClass extends StatementTypeClass<
    'doWhileStatement',
    ParExpressionTypeClass
> {
    private block: NormalBlockTypeClass | ApexErrorTypeClass;

    private constructor(
        value: ParExpressionTypeClass | ApexErrorTypeClass,
        block: NormalBlockTypeClass | ApexErrorTypeClass,
    ) {
        super('doWhileStatement', value);
        this.block = block;
    }

    static create(ctx: DoWhileStatementContext): DoWhileStatementTypeClass {
        if (!ctx.parExpression() || !ctx.block()) {
            throw new Error('値が異常です。DoWhileStatementContext: ' + ctx.getText());
        }

        return new DoWhileStatementTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.parExpression()),
                isParExpressionType,
                'parExpression',
            ),
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock() {
        return this.block;
    }
}

export const isDoWhileStatementType = (
    target: ApexCommonTypeClass<string>,
): target is DoWhileStatementTypeClass => {
    return target instanceof DoWhileStatementTypeClass;
};

