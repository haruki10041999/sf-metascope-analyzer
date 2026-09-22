import { SoqlFunctionContext, SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

export type SoqlFieldParameterName = 'ALL' | 'CUSTOM' | 'STANDARD';

export type FieldsFunctionType = {
    type: 'FIELDS';
    parameter: SoqlFieldParameterName;
};

export const isFieldsFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.FIELDS() !== undefined;
};

export const makeFieldsFunctionType = (ctx: SoqlFieldsParameterContext): FieldsFunctionType => {
    let parameter: SoqlFieldParameterName | undefined = undefined;
    if (ctx.ALL()) {
        parameter = 'ALL';
    } else if (ctx.CUSTOM()) {
        parameter = 'CUSTOM';
    } else if (ctx.STANDARD()) {
        parameter = 'STANDARD';
    } else {
        throw new Error(`値が異常です,SoqlFieldsParameterContext${ctx.getText()}`);
    }

    return {
        type: 'FIELDS',
        parameter: parameter,
    };
};
