import { FromNameListContext } from '@apexdevtools/apex-parser';

export type FromField = {
    apiName: string;
};

export const makeFromField = (ctx: FromNameListContext): FromField => {
    const fieldNames = ctx.fieldName_list();
    if (ctx.soqlId_list().length > 1 && fieldNames.length === 0 && fieldNames.length > 1) {
        throw new Error(`値が異常です,FromNameListContext:${ctx.getText()}`);
    }

    return {
        apiName: fieldNames.at(-1)!.getText(),
    };
};
