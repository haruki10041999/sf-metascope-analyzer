import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import { PrimaryTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../commonVisitor';

export class IdPrimaryTypeClass extends PrimaryTypeClass<NormalIdTypeClass> {
    private constructor(
        value: NormalIdTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('idPrimary', value, errorClasses);
    }

    static create(ctx: IdPrimaryContext): IdPrimaryTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。IdPrimaryContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};
        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        return new IdPrimaryTypeClass(value, errorClasses);
    }
}

export const isIdPrimaryType = (target: CommonTypeClass): target is IdPrimaryTypeClass => {
    return target instanceof IdPrimaryTypeClass;
};

