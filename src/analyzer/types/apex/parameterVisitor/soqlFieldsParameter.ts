import { SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

export type SoqlFieldsParameterType = {
    type: 'soqlFieldsParameter';
    param: 'ALL' | 'CUSTOM' | 'STANDARD';
};

export const makeSoqlFieldsParameterType = (
    ctx: SoqlFieldsParameterContext,
): SoqlFieldsParameterType => {
    if (ctx.ALL()) {
        return {
            type: 'soqlFieldsParameter',
            param: 'ALL',
        };
    }
    if (ctx.CUSTOM()) {
        return {
            type: 'soqlFieldsParameter',
            param: 'CUSTOM',
        };
    }
    if (ctx.STANDARD()) {
        return {
            type: 'soqlFieldsParameter',
            param: 'STANDARD',
        };
    }

    throw new Error('値が異常です。SoqlFieldsParameterContext: ' + ctx.getText());
};
