import { ForStatementContext } from '@apexdevtools/apex-parser';

import {
    NormalStatementTypeClass,
    StatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '.';

import { ForControlTypeClass, ControlVisitor, isForControlType } from '../controlVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ForStatementTypeClass extends StatementTypeClass<'forStatement', ForControlTypeClass> {
    private block: NormalStatementTypeClass | ApexErrorTypeClass;

    private constructor(
        value: ForControlTypeClass | ApexErrorTypeClass,
        block: NormalStatementTypeClass | ApexErrorTypeClass,
    ) {
        super('forStatement', value);
        this.block = block;
    }

    static create(ctx: ForStatementContext): ForStatementTypeClass {
        if (!ctx.forControl() || !ctx.statement()) {
            throw new Error('値が異常です。ForStatementContext: ' + ctx.getText());
        }

        return new ForStatementTypeClass(
            visitNode(new ControlVisitor(), ctx.forControl(), isForControlType, 'forControl'),
            visitNode(new StatementVisitor(), ctx.statement(), isNormalStatementType, 'statement'),
        );
    }

    getBlock(): NormalStatementTypeClass | ApexErrorTypeClass {
        return this.block;
    }
}

export const isForStatementType = (
    target: ApexCommonTypeClass<string>,
): target is ForStatementTypeClass => {
    return target instanceof ForStatementTypeClass;
};
