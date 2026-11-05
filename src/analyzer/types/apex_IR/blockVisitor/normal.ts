import { BlockContext } from '@apexdevtools/apex-parser';

import { BlockListTypeClass } from '.';

import {
    NormalStatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '../statementVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class NormalBlockTypeClass extends BlockListTypeClass<'block', NormalStatementTypeClass> {
    private constructor(value: (NormalStatementTypeClass | ApexErrorTypeClass)[]) {
        super('block', value);
    }

    static create(ctx: BlockContext): NormalBlockTypeClass {
        return new NormalBlockTypeClass(
            visitNodeList(
                new StatementVisitor(),
                ctx.statement_list(),
                isNormalStatementType,
                'statement_list',
            ),
        );
    }
}

export const isNormalBlockType = (
    target: ApexCommonTypeClass<string>,
): target is NormalBlockTypeClass => {
    return target instanceof NormalBlockTypeClass;
};
