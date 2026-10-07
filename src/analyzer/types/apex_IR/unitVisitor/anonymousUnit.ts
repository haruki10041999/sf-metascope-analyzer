import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { UnitTypeClass } from '.';

import { AnonymousBlockTypeClass, BlockVisitor, isAnonymousBlockType } from '../blockVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class AnonymousUnitTypeClass extends UnitTypeClass<AnonymousBlockTypeClass> {
    private constructor(value: AnonymousBlockTypeClass | ErrorTypeClass) {
        super('anonymousUnit', value);
    }

    static create(ctx: AnonymousUnitContext): AnonymousUnitTypeClass {
        if (!ctx.anonymousBlock()) {
            throw new Error('値が異常です。AnonymousUnitContext: ' + ctx.getText());
        }

        return new AnonymousUnitTypeClass(
            isValidClass(
                new BlockVisitor().visit(ctx.anonymousBlock()),
                isAnonymousBlockType,
                'anonymousUnit',
            ),
        );
    }
}

export const isAnonymousUnitType = (target: CommonTypeClass): target is AnonymousUnitTypeClass => {
    return target instanceof AnonymousUnitTypeClass;
};

