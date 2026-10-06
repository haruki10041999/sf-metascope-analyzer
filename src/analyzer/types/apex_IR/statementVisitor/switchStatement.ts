import { SwitchStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { WhenControlTypeClass, ControlVisitor, isWhenControlType } from '../controlVisitor';
import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class SwitchStatementTypeClass extends StatementTypeClass<ExpressionAllTypeClass> {
    private block: (WhenControlTypeClass | ErrorTypeClass)[];

    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
        blocks: (WhenControlTypeClass | ErrorTypeClass)[],
    ) {
        super('switchStatement', value);
        this.block = blocks;
    }

    static create(ctx: SwitchStatementContext): SwitchStatementTypeClass {
        if (!ctx.expression() || !ctx.whenControl_list() || ctx.whenControl_list().length === 0) {
            throw new Error('値が異常です。SwitchStatementContext: ' + ctx.getText());
        }

        return new SwitchStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            isValidClassList(
                ctx.whenControl_list(),
                (ctx) => new ControlVisitor().visit(ctx),
                isWhenControlType,
                'whenControl_list',
            ),
        );
    }

    getBlocks(): (WhenControlTypeClass | ErrorTypeClass)[] {
        return this.block;
    }
}

export const isSwitchStatementType = (
    target: CommonTypeClass,
): target is SwitchStatementTypeClass => {
    return target instanceof SwitchStatementTypeClass;
};

