import { PrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class NormalPrimaryTypeClass extends PrimaryTypeClass<string> {
    private constructor(value: string) {
        super('primary', value);
    }

    static create(ctx: PrimaryContext): NormalPrimaryTypeClass {
        return new NormalPrimaryTypeClass(ctx.getText());
    }
}

export const isNormalPrimaryType = (target: CommonTypeClass): target is NormalPrimaryTypeClass => {
    return target instanceof NormalPrimaryTypeClass;
};

