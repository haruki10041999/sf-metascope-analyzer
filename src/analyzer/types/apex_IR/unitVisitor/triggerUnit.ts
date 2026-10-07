import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { TriggerCaseTypeClass, UnitListTypeClass, UnitVisitor, isTriggerCaseType } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { TriggerBlockTypeClass, BlockVisitor, isTriggerBlockType } from '../blockVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TriggerUnitTypeClass extends UnitListTypeClass<NormalIdTypeClass> {
    private triggerCase: (TriggerCaseTypeClass | ErrorTypeClass)[];
    private block: TriggerBlockTypeClass | ErrorTypeClass;

    private constructor(
        value: (NormalIdTypeClass | ErrorTypeClass)[],
        triggerCase: (TriggerCaseTypeClass | ErrorTypeClass)[],
        block: TriggerBlockTypeClass | ErrorTypeClass,
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
            isValidClassList(
                ctx.id_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isNormalIdType,
                'id',
            ),
            isValidClassList(
                ctx.triggerCase_list(),
                (ctx) => new UnitVisitor().visit(ctx),
                isTriggerCaseType,
                'triggerCase',
            ),
            isValidClass(
                new BlockVisitor().visit(ctx.triggerBlock()),
                isTriggerBlockType,
                'triggerBlock',
            ),
        );
    }

    getTriggerCase(): (TriggerCaseTypeClass | ErrorTypeClass)[] {
        return this.triggerCase;
    }

    getBlock(): TriggerBlockTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isTriggerUnitType = (value: any): value is TriggerUnitTypeClass => {
    return value instanceof TriggerUnitTypeClass;
};

