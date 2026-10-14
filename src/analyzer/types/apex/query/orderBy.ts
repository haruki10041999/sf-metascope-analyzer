import { FieldOrderClass, isSoqlFunctionClass, isStringArray } from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';

export type OrderByField = {
    field: string[] | SoqlFunctionField;
    direction?: 'ASC' | 'DESC';
    nulls?: 'FIRST' | 'LAST';
};

export const makeOrderByField = (orderByClause: FieldOrderClass[]): OrderByField[] | undefined => {
    const orderByFields: OrderByField[] = [];

    orderByClause.forEach((orderBy) => {
        const value = orderBy.getValue();
        const direction = orderBy.getDirection();
        const nulls = orderBy.getNulls();

        let orderByField: OrderByField | undefined = undefined;
        if (value) {
            if (isStringArray(value)) {
                orderByField = {
                    field: value,
                };
            }

            if (isSoqlFunctionClass(value)) {
                const soqlFunction = makeSoqlFunctionField(value);
                if (soqlFunction) {
                    orderByField = {
                        field: soqlFunction,
                    };
                }
            }
        }

        if (orderByField) {
            if (direction) {
                orderByField.direction = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            }
            if (nulls) {
                orderByField.nulls = nulls.toUpperCase() === 'FIRST' ? 'FIRST' : 'LAST';
            }

            orderByFields.push(orderByField);
        }
    });

    if (orderByFields.length > 0) {
        return orderByFields;
    }

    return undefined;
};
