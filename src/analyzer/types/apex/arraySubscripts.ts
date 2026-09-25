import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

export type ArraySubscriptsType = {
    type: 'arraySubscripts';
    dimentions: number;
};

export const makeArraySubscriptsType = (ctx: ArraySubscriptsContext): ArraySubscriptsType => ({
    type: 'arraySubscripts',
    dimentions: ctx.LBRACK_list().length || 0,
});
