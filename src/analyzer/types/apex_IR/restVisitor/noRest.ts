import { NoRestContext } from '@apexdevtools/apex-parser';

import { RestTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NoRestTypeClass extends RestTypeClass<string> {
    private constructor(value: string) {
        super('noRest', value);
    }

    static create(ctx: NoRestContext): NoRestTypeClass {
        return new NoRestTypeClass(ctx.getText());
    }
}

export const isNoRestType = (target: CommonTypeClass): target is NoRestTypeClass => {
    return target instanceof NoRestTypeClass;
};

