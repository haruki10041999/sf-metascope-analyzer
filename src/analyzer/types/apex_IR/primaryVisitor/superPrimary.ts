import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class SuperPrimaryTypeClass extends PrimaryTypeClass<string> {
    private constructor(value: string) {
        super('superPrimary', value);
    }

    static create(ctx: SuperPrimaryContext): SuperPrimaryTypeClass {
        if (!ctx.SUPER()) {
            throw new Error('値が異常です。 SuperPrimaryContext:' + ctx);
        }

        return new SuperPrimaryTypeClass(ctx.SUPER().getText());
    }
}

export const isSuperPrimaryType = (target: CommonTypeClass): target is SuperPrimaryTypeClass => {
    return target instanceof SuperPrimaryTypeClass;
};

