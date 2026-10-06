import { ForClausesContext } from '@apexdevtools/apex-parser';

import { ClauseListTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ForClausesTypeClass extends ClauseListTypeClass<string> {
    private constructor(value: string[]) {
        super('forClauses', value);
    }

    static create(ctx: ForClausesContext): ForClausesTypeClass {
        if (!ctx.VIEW_list() && !ctx.UPDATE_list() && !ctx.REFERENCE_list()) {
            throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
        }

        return new ForClausesTypeClass([
            ...Array(ctx.VIEW_list().length).fill('VIEW'),
            ...Array(ctx.UPDATE_list().length).fill('UPDATE'),
            ...Array(ctx.REFERENCE_list().length).fill('REFERENCE'),
        ]);
    }
}

export const isForClausesType = (target: CommonTypeClass): target is ForClausesTypeClass => {
    return target instanceof ForClausesTypeClass;
};
