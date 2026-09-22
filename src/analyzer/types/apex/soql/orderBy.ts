import {
    OrderByClauseContext,
    FieldOrderListContext,
    FieldOrderContext,
} from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from './field';

export type OrderByField = {
    order: number;
    field: SoqlField;
    directionSetting: 'None' | 'ASC' | 'DESC';
    isNullsSetting: 'None' | 'FIRST' | 'LAST';
};

export const makeOrderByList = (ctx: OrderByClauseContext): OrderByField[] => {
    const orderByFields: OrderByField[] = [];

    ctx.fieldOrderList()
        .fieldOrder_list()
        .forEach((fieldOrder: FieldOrderContext, index: number) => {
            const soqlField = makeSoqlField(fieldOrder.fieldName());

            let directionSetting: 'None' | 'ASC' | 'DESC' = 'None';
            if (fieldOrder.ASC()) {
                directionSetting = 'ASC';
            } else if (fieldOrder.DESC()) {
                directionSetting = 'DESC';
            }

            let isNullsSetting: 'None' | 'FIRST' | 'LAST' = 'None';
            if (fieldOrder.NULLS()) {
                if (fieldOrder.FIRST()) {
                    isNullsSetting = 'FIRST';
                } else if (fieldOrder.LAST()) {
                    isNullsSetting = 'LAST';
                }
            }

            orderByFields.push({
                order: index + 1,
                field: soqlField,
                directionSetting: directionSetting,
                isNullsSetting: isNullsSetting,
            });
        });

    return orderByFields;
};
