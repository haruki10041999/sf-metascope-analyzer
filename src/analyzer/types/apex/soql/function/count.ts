import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from '../field';

export type CountFunctionType = {
    type: 'COUNT';
    field?: SoqlField;
};

export const isCountFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.COUNT() !== undefined;
};

export const makeCountFunctionType = (ctx: SoqlFunctionContext): CountFunctionType => {
    const functionType: CountFunctionType = {
        type: 'COUNT',
    };
    if (ctx.fieldName()) {
        functionType.field = makeSoqlField(ctx.fieldName());
    }

    return functionType;
};
