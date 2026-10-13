import { TypeOfClass, WhenClauseClass, isTypeOfClass } from '../converter';

type ConditionBlock = {
    object: string[] | 'else';
    fields: string[][];
};

export type TypeOfField = {
    field: string[];
    conditionBlock: ConditionBlock[];
};

export const makeTypeOfField = (typeOf: TypeOfClass): TypeOfField | undefined => {
    const value = typeOf.getValue();
    const whenClause = typeOf.getWhenClause();
    const elseClause = typeOf.getElseClause();

    if (value.length > 0 && whenClause.length > 0) {
        const conditionBlock: ConditionBlock[] = [];

        whenClause.forEach((where) => {
            const object = where.getValue();
            const field = where.getField();

            if (object.length > 0 && field.length > 0) {
                conditionBlock.push({
                    object: object,
                    fields: field.sort(
                        (a, b) => a.length - b.length || a.at(0)!.localeCompare(b.at(0)!),
                    ),
                });
            }
        });

        if (elseClause.length > 0) {
            conditionBlock.push({
                object: 'else',
                fields: elseClause,
            });
        }

        return {
            field: value,
            conditionBlock: conditionBlock,
        };
    }

    return undefined;
};

