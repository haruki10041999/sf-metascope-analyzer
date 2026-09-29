import { IdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass as idTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class IdTypeClass extends idTypeClass {
    private constructor(id: string) {
        super('id', id, []);
    }

    static create(ctx: IdContext): IdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。IdContext: ' + ctx);
        }

        return new IdTypeClass(ctx.getText());
    }
}

export const isIdType = (target: CommonTypeClass): target is IdTypeClass => {
    return target instanceof IdTypeClass;
};
