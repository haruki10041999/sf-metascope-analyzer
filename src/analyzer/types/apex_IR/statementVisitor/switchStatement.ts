import { SwitchStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { WhenControlTypeClass, ControlVisitor, isWhenControlType } from '../controlVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class SwitchStatementTypeClass extends StatementTypeClass<
    'switchStatement',
    BasedExpressionTypeClass
> {
    private block: (WhenControlTypeClass | ApexErrorTypeClass)[];

    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        blocks: (WhenControlTypeClass | ApexErrorTypeClass)[],
    ) {
        super('switchStatement', value);
        this.block = blocks;
    }

    static create(ctx: SwitchStatementContext): SwitchStatementTypeClass {
        if (!ctx.expression() || !ctx.whenControl_list() || ctx.whenControl_list().length === 0) {
            throw new Error('値が異常です。SwitchStatementContext: ' + ctx.getText());
        }

        return new SwitchStatementTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            visitNodeList(
                new ControlVisitor(),
                ctx.whenControl_list(),
                isWhenControlType,
                'whenControl_list',
            ),
        );
    }

    getBlocks(): (WhenControlTypeClass | ApexErrorTypeClass)[] {
        return this.block;
    }
}

export const isSwitchStatementType = (
    target: ApexCommonTypeClass<string>,
): target is SwitchStatementTypeClass => {
    return target instanceof SwitchStatementTypeClass;
};
