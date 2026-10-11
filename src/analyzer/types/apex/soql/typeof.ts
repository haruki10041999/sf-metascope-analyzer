import { TypeOf } from '../converter';

type ConditionBlock = {
    object: string[] | 'else';
    fields: string[][];
};

export type TypeOfField =
    | {
          kind: 'typeOf';
          field: string[];
          conditionBlock: ConditionBlock[];
      }
    | 'unSuporrted';

export const makeTypeOfField = (typeOf: TypeOf): TypeOfField => {
    const { value, whenClause, elseClause } = typeOf;

    if (value.length > 0) {
        const conditionBlock: ConditionBlock[] = [];
        whenClause.forEach((where) => {
            const { value: object, field } = where;
            conditionBlock.push({
                object: object,
                fields: field,
            });
        });

        if (elseClause) {
            conditionBlock.push({
                object: 'else',
                fields: elseClause,
            });
        }

        return {
            kind: 'typeOf',
            field: value,
            conditionBlock: conditionBlock,
        };
    }

    return 'unSuporrted';
};
