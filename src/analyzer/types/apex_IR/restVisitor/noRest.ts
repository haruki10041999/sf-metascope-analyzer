import { NoRestContext } from '@apexdevtools/apex-parser';

import { RestValueTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NoRestTypeClass extends RestValueTypeClass<'noRest', string> {
    private constructor(value: string) {
        super('noRest', value);
    }

    static create(ctx: NoRestContext): NoRestTypeClass {
        return new NoRestTypeClass(ctx.getText());
    }
}

export const isNoRestType = (target: CommonTypeClass<string>): target is NoRestTypeClass => {
    return target instanceof NoRestTypeClass;
};
