import {
    NormalStatement,
    IfStatement,
    SwitchStatement,
    ForStatement,
    WhileStatement,
    DoWhileStatement,
    TryStatement,
} from '../converter';

type IfCondition = any | 'else';
type IFType = {
    condition: IfCondition;
    block: any;
};

export const makeIfStatementType = (statement: IfStatement): any => {
    if (statement) {
        const {};
    }

    return undefined;
};
