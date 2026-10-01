import { NoRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NoRestTypeClass extends RestTypeClass<string> {
    private constructor(value: string) {
        super('noRest', value, {});
    }

    static create(ctx: NoRestContext): NoRestTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。NoRestContext: ' + ctx);
        }

        return new NoRestTypeClass(ctx.getText());
    }
}

export const isNoRestType = (target: CommonTypeClass): target is NoRestTypeClass => {
    return target instanceof NoRestTypeClass;
};

