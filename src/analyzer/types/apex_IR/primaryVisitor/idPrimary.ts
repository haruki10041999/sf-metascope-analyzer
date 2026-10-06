import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import { PrimaryTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class IdPrimaryTypeClass extends PrimaryTypeClass<NormalIdTypeClass> {
    private constructor(value: NormalIdTypeClass | ErrorTypeClass) {
        super('idPrimary', value);
    }

    static create(ctx: IdPrimaryContext): IdPrimaryTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。IdPrimaryContext: ' + ctx.getText());
        }

        return new IdPrimaryTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
        );
    }
}

export const isIdPrimaryType = (target: CommonTypeClass): target is IdPrimaryTypeClass => {
    return target instanceof IdPrimaryTypeClass;
};

