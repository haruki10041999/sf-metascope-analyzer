import { AnyIdContext } from '@apexdevtools/apex-parser';

import { IdValueTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class AnyIdTypeClass extends IdValueTypeClass<'anyId', string> {
    private constructor(value: string) {
        super('anyId', value);
    }

    static create(ctx: AnyIdContext): AnyIdTypeClass {
        return new AnyIdTypeClass(ctx.getText());
    }
}

export const isAnyIdType = (target: CommonTypeClass<string>): target is AnyIdTypeClass => {
    return target instanceof AnyIdTypeClass;
};
