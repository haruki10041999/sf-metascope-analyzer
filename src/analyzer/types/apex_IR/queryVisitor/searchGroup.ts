import { SearchGroupContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class SearchGroupTypeClass extends QueryTypeClass<string> {
    private constructor(value: string) {
        super('searchGroup', value);
    }

    static create(ctx: SearchGroupContext): SearchGroupTypeClass {
        if (!ctx.ALL() && !ctx.EMAIL() && !ctx.NAME() && !ctx.PHONE() && !ctx.SIDEBAR()) {
            throw new Error('値が異常です。SearchGroupContext: ' + ctx.getText());
        }

        let value: string;

        if (ctx.ALL()) {
            value = 'ALL';
        } else if (ctx.EMAIL()) {
            value = 'EMAIL';
        } else if (ctx.NAME()) {
            value = 'NAME';
        } else if (ctx.PHONE()) {
            value = 'PHONE';
        } else {
            value = 'SIDEBAR';
        }

        return new SearchGroupTypeClass(value);
    }
}

export const isSearchGroupType = (target: CommonTypeClass): target is SearchGroupTypeClass => {
    return target instanceof SearchGroupTypeClass;
};
