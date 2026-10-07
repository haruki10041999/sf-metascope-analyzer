import { ForClausesContext } from '@apexdevtools/apex-parser';

import { ClauseListTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

type ForClauseValueType = 'VIEW' | 'UPDATE' | 'REFERENCE';

export class ForClausesTypeClass extends ClauseListTypeClass<ForClauseValueType> {
    private constructor(value: ForClauseValueType[]) {
        super('forClauses', value);
    }

    static create(ctx: ForClausesContext): ForClausesTypeClass {
        if (ctx.FOR_list().length === 0) {
            throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
        }

        const tokens: [ForClauseValueType, number][] = [
            ...ctx
                .VIEW_list()
                .map((n): [ForClauseValueType, number] => ['VIEW', n.symbol.tokenIndex]),
            ...ctx
                .UPDATE_list()
                .map((n): [ForClauseValueType, number] => ['UPDATE', n.symbol.tokenIndex]),
            ...ctx
                .REFERENCE_list()
                .map((n): [ForClauseValueType, number] => ['REFERENCE', n.symbol.tokenIndex]),
        ];

        return new ForClausesTypeClass(tokens.sort((a, b) => a[1] - b[1]).map(([value]) => value));
    }
}

export const isForClausesType = (target: CommonTypeClass): target is ForClausesTypeClass => {
    return target instanceof ForClausesTypeClass;
};

