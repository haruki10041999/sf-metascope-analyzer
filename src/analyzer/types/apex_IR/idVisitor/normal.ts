import { IdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class NormalIdTypeClass extends IdTypeClass<string> {
    private constructor(value: string) {
        super('id', value, {});
    }

    static create(ctx: IdContext): NormalIdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。IdContext: ' + ctx);
        }

        return new NormalIdTypeClass(ctx.getText());
    }
}

export const isNormalIdType = (target: CommonTypeClass): target is NormalIdTypeClass => {
    return target instanceof NormalIdTypeClass;
};
