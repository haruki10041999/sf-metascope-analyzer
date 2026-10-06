import { ForStatementContext } from '@apexdevtools/apex-parser';

import {
    NormalStatementTypeClass,
    StatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '.';

import { ForControlTypeClass, ControlVisitor, isForControlType } from '../controlVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ForStatementTypeClass extends StatementTypeClass<ForControlTypeClass> {
    private block: NormalStatementTypeClass | ErrorTypeClass;

    private constructor(
        value: ForControlTypeClass | ErrorTypeClass,
        block: NormalStatementTypeClass | ErrorTypeClass,
    ) {
        super('forStatement', value);
        this.block = block;
    }

    static create(ctx: ForStatementContext): ForStatementTypeClass {
        if (!ctx.forControl() || !ctx.statement()) {
            throw new Error('値が異常です。ForStatementContext: ' + ctx.getText());
        }

        return new ForStatementTypeClass(
            isValidClass(
                new ControlVisitor().visit(ctx.forControl()),
                isForControlType,
                'forControl',
            ),
            isValidClass(
                new StatementVisitor().visit(ctx.statement()),
                isNormalStatementType,
                'statement',
            ),
        );
    }

    getBlock(): NormalStatementTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isForStatementType = (target: CommonTypeClass): target is ForStatementTypeClass => {
    return target instanceof ForStatementTypeClass;
};

