import { NormalBlock } from './converter';

import { StatementType, makeStatementType } from './statement';

export type BlockType = StatementType[] | undefined;

export const makeBlockType = (block: NormalBlock): BlockType => {
    if (block) {
        const statements: any[] = [];

        block.forEach((statement) => {
            statements.push(makeStatementType(statement));
        });

        return statements;
    }

    return undefined;
};
