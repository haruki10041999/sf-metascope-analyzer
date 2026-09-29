import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { IdTypeClass, IdVisitor, isIdType } from '../idVisitor';

import { PrimaryTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class IdPrimaryTypeClass extends PrimaryTypeClass {
    private constructor(value: IdTypeClass | null, errorClasses: ErrorTypeClass[]) {
        super('idPrimary', value, errorClasses);
    }

    static create(ctx: IdPrimaryContext): IdPrimaryTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。IdPrimaryContext: ' + ctx.getText());
        }

        let value: IdTypeClass | null = null;
        const errorClasses: ErrorTypeClass[] = [];
        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isIdType(idTypeClass)) {
            value = idTypeClass;
        } else {
            errorClasses.push(idTypeClass);
        }

        return new IdPrimaryTypeClass(value, errorClasses);
    }
}

export const isIdPrimaryType = (target: CommonTypeClass): target is IdPrimaryTypeClass => {
    return target instanceof IdPrimaryTypeClass;
};
