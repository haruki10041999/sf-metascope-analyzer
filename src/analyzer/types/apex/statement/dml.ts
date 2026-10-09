import { DmlStatement, UpsertStatement, MergeStatement, AccessLevel } from '../converter';

import { makeExpressionType } from '../expression';

export const makeDmlType = (type: string, statement: DmlStatement): any => {
    const variant = makeExpressionType(statement.value);

    return {
        type: type,
        variant: variant,
        accessLevel: statement.accessLevel ? statement.accessLevel : undefined,
    };
};

export const makeUpsertType = (statement: UpsertStatement): any => {
    const key = statement.key;

    return {
        type: 'upsert',
        key: key,
        accessLevel: statement.accessLevel ? statement.accessLevel : undefined,
    };
};

export const makeMergeType = (statement: MergeStatement): any => {
    return {
        type: 'merge',
        variants: statement.value?.map((value) => makeExpressionType(value)),
        accessLevel: statement.accessLevel ? statement.accessLevel : undefined,
    };
};
