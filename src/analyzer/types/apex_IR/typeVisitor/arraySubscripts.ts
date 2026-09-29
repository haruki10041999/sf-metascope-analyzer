import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

export type ArraySubscriptsType = {
    type: 'arraySubscripts';
    variantType: number;
};

export const makeArraySubscriptsType = (ctx: ArraySubscriptsContext): ArraySubscriptsType => {
    if (
        (ctx.LBRACK_list() && !ctx.RBRACK_list()) ||
        (ctx.RBRACK_list() && !ctx.LBRACK_list()) ||
        ctx.LBRACK_list().length !== ctx.RBRACK_list().length
    ) {
        throw new Error('値が異常です。ArraySubscriptsContext: ' + ctx.getText());
    }

    return {
        type: 'arraySubscripts',
        variantType: ctx.LBRACK_list().length || 0,
    };
};
