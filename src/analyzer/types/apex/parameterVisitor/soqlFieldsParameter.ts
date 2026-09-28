import { SoqlFieldsParameterContext } from '@apexdevtools/apex-parser';

export type SoqlFieldsParameterType = {
    type: 'soqlFieldsParameter';
    parameter: 'ALL' | 'CUSTOM' | 'STANDARD';
};

export const makeSoqlFieldsParameterType = (
    ctx: SoqlFieldsParameterContext,
): SoqlFieldsParameterType => {
    if (ctx.ALL()) {
        return {
            type: 'soqlFieldsParameter',
            parameter: 'ALL',
        };
    }
    if (ctx.CUSTOM()) {
        return {
            type: 'soqlFieldsParameter',
            parameter: 'CUSTOM',
        };
    }
    if (ctx.STANDARD()) {
        return {
            type: 'soqlFieldsParameter',
            parameter: 'STANDARD',
        };
    }

    throw new Error('値が異常です。SoqlFieldsParameterContext: ' + ctx.getText());
};
