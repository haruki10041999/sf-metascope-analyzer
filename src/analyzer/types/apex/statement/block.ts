import { NormalStatementClass } from '../converter';

import { StatementType, makeStatementType } from './statement';
import { LocalVariableField, makeLocalVariableField } from './localVariable';

export type BlockField = {
    kind: 'block';
    variable?: string;
    block: StatementType[];
};

export const makeBlockField = (statement: NormalStatementClass[]): BlockField | undefined => {
    const statementTypes: StatementType[] = [];

    statement.forEach((s) => {
        const statementType = makeStatementType(s);
        if (statementType) {
            statementTypes.push(statementType);
        }
    });

    if (statementTypes.length > 0) {
        return {
            kind: 'block',
            block: statementTypes,
        };
    }

    return undefined;
};
