import { PrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryValueTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class NormalPrimaryTypeClass extends PrimaryValueTypeClass<'primary', string> {
    private constructor(value: string) {
        super('primary', value);
    }

    static create(ctx: PrimaryContext): NormalPrimaryTypeClass {
        return new NormalPrimaryTypeClass(ctx.getText());
    }
}

export const isNormalPrimaryType = (
    target: CommonTypeClass<string>,
): target is NormalPrimaryTypeClass => {
    return target instanceof NormalPrimaryTypeClass;
};
