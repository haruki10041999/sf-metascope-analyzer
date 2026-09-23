import { UsingScopeContext } from '@apexdevtools/apex-parser';

export type UsingScopeField = {
    field: string;
};

export const makeUsingScopeField = (ctx: UsingScopeContext): UsingScopeField => {
    if (ctx.USING() && ctx.SCOPE()) {
        return {
            field: ctx.soqlId().getText(),
        };
    }

    throw new Error(`値が異常です,UsingScopeContext${ctx.getText()}`);
};
