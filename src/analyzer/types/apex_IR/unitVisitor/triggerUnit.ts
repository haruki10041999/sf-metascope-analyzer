import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { TriggerCaseTypeClass, UnitListTypeClass, UnitVisitor, isTriggerCaseType } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { TriggerBlockTypeClass, BlockVisitor, isTriggerBlockType } from '../blockVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class TriggerUnitTypeClass extends UnitListTypeClass<'triggerUnit', NormalIdTypeClass> {
    private triggerCase: (TriggerCaseTypeClass | ApexErrorTypeClass)[];
    private block: TriggerBlockTypeClass | ApexErrorTypeClass;

    private constructor(
        value: (NormalIdTypeClass | ApexErrorTypeClass)[],
        triggerCase: (TriggerCaseTypeClass | ApexErrorTypeClass)[],
        block: TriggerBlockTypeClass | ApexErrorTypeClass,
    ) {
        super('triggerUnit', value);
        this.triggerCase = triggerCase;
        this.block = block;
    }

    static create(ctx: TriggerUnitContext): TriggerUnitTypeClass {
        if (
            (!ctx.id_list() || ctx.id_list().length === 0) &&
            (!ctx.triggerCase_list() || ctx.triggerCase_list().length === 0) &&
            !ctx.triggerBlock()
        ) {
            throw new Error('値が異常です。TriggerUnitContext: ' + ctx.getText());
        }

        return new TriggerUnitTypeClass(
            isApexValidClassList(
                ctx.id_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isNormalIdType,
                'id',
            ),
            isApexValidClassList(
                ctx.triggerCase_list(),
                (ctx) => new UnitVisitor().visit(ctx),
                isTriggerCaseType,
                'triggerCase',
            ),
            isApexValidClass(
                new BlockVisitor().visit(ctx.triggerBlock()),
                isTriggerBlockType,
                'triggerBlock',
            ),
        );
    }

    getTriggerCase(): (TriggerCaseTypeClass | ApexErrorTypeClass)[] {
        return this.triggerCase;
    }

    getBlock(): TriggerBlockTypeClass | ApexErrorTypeClass {
        return this.block;
    }
}

export const isTriggerUnitType = (value: any): value is TriggerUnitTypeClass => {
    return value instanceof TriggerUnitTypeClass;
};

