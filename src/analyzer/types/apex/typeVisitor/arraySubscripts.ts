import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

export type ArraySubscriptsType = {
    type: 'arraySubscripts';
    variantType: number;
};

export const makeArraySubscriptsType = (ctx: ArraySubscriptsContext): ArraySubscriptsType => ({
    type: 'arraySubscripts',
    variantType: ctx.LBRACK_list().length || 0,
});
