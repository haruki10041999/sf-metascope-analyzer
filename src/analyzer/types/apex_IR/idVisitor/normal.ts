import { IdContext } from '@apexdevtools/apex-parser';

import { IdValueTypeClass } from '.';

import { ApexCommonTypeClass } from '../commonVisitor';

export class NormalIdTypeClass extends IdValueTypeClass<'id', string> {
    private constructor(value: string) {
        super('id', value);
    }

    static create(ctx: IdContext): NormalIdTypeClass {
        return new NormalIdTypeClass(ctx.getText());
    }
}

export const isNormalIdType = (
    target: ApexCommonTypeClass<string>,
): target is NormalIdTypeClass => {
    return target instanceof NormalIdTypeClass;
};
