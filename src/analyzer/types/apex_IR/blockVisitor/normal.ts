import { BlockContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from '.';

import {
    NormalStatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '../statementVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class NormalBlockTypeClass extends BlockTypeClass<NormalStatementTypeClass[]> {
    private constructor(
        value: NormalStatementTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('block', value, errorClasses);
    }

    static create(ctx: BlockContext): NormalBlockTypeClass {
        if (!ctx.statement_list() || ctx.statement_list().length === 0) {
            throw new Error('値が異常です。BlockContext: ' + ctx.getText());
        }

        let value: NormalStatementTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.statement_list().forEach((statmentCtx, index) => {
            const statement = new StatementVisitor().visit(statmentCtx);
            if (isNormalStatementType(statement)) {
                value.push(statement);
            } else if (isErrorType(statement)) {
                errorClasses[`value_${index}`] = statement;
            }
        });

        return new NormalBlockTypeClass(value, errorClasses);
    }
}

export const isNormalBlockType = (target: CommonTypeClass): target is NormalBlockTypeClass => {
    return target instanceof NormalBlockTypeClass;
};

