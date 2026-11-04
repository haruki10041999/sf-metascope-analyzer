import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { UnitTypeClass } from '.';

import { AnonymousBlockTypeClass, BlockVisitor, isAnonymousBlockType } from '../blockVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class AnonymousUnitTypeClass extends UnitTypeClass<
    'anonymousUnit',
    AnonymousBlockTypeClass
> {
    private constructor(value: AnonymousBlockTypeClass | ApexErrorTypeClass) {
        super('anonymousUnit', value);
    }

    static create(ctx: AnonymousUnitContext): AnonymousUnitTypeClass {
        if (!ctx.anonymousBlock()) {
            throw new Error('値が異常です。AnonymousUnitContext: ' + ctx.getText());
        }

        return new AnonymousUnitTypeClass(
            isApexValidClass(
                new BlockVisitor().visit(ctx.anonymousBlock()),
                isAnonymousBlockType,
                'anonymousUnit',
            ),
        );
    }
}

export const isAnonymousUnitType = (
    target: ApexCommonTypeClass<string>,
): target is AnonymousUnitTypeClass => {
    return target instanceof AnonymousUnitTypeClass;
};

