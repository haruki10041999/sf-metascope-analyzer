import { BlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '.';

import {
    NormalStatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '../statementVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class NormalBlockTypeClass extends BlockListTypeClass<'block', NormalStatementTypeClass> {
    private constructor(value: (NormalStatementTypeClass | ErrorTypeClass)[]) {
        super('block', value);
    }

    static create(ctx: BlockContext): NormalBlockTypeClass {
        return new NormalBlockTypeClass(
            isValidClassList(
                ctx.statement_list(),
                (ctx) => new StatementVisitor().visit(ctx),
                isNormalStatementType,
                'statement_list',
            ),
        );
    }
}

export const isNormalBlockType = (
    target: CommonTypeClass<string>,
): target is NormalBlockTypeClass => {
    return target instanceof NormalBlockTypeClass;
};
