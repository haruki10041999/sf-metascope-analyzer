import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import { PrimaryTypeClass } from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, isApexValidClass } from '../commonVisitor';

export class IdPrimaryTypeClass extends PrimaryTypeClass<'idPrimary', NormalIdTypeClass> {
    private constructor(value: NormalIdTypeClass | ApexErrorTypeClass) {
        super('idPrimary', value);
    }

    static create(ctx: IdPrimaryContext): IdPrimaryTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。IdPrimaryContext: ' + ctx.getText());
        }

        return new IdPrimaryTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
        );
    }
}

export const isIdPrimaryType = (
    target: ApexCommonTypeClass<string>,
): target is IdPrimaryTypeClass => {
    return target instanceof IdPrimaryTypeClass;
};

