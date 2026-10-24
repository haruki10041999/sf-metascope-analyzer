import { TriggerCaseContext } from '@apexdevtools/apex-parser';

import { UnitValueTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class TriggerCaseTypeClass extends UnitValueTypeClass<'triggerCase', 'BEFORE' | 'AFTER'> {
    private triggerCaseType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
    private constructor(
        value: 'BEFORE' | 'AFTER',
        triggerCaseType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE',
    ) {
        super('triggerCase', value);
        this.triggerCaseType = triggerCaseType;
    }

    static create(ctx: TriggerCaseContext): TriggerCaseTypeClass {
        if (
            (!ctx.BEFORE() && !ctx.AFTER()) ||
            (!ctx.INSERT() && !ctx.UPDATE() && !ctx.DELETE() && !ctx.UNDELETE())
        ) {
            throw new Error('値が異常です。TriggerCaseContext: ' + ctx.getText());
        }

        return new TriggerCaseTypeClass(
            ctx.BEFORE() ? 'BEFORE' : 'AFTER',
            ctx.INSERT()
                ? 'INSERT'
                : ctx.UPDATE()
                  ? 'UPDATE'
                  : ctx.DELETE()
                    ? 'DELETE'
                    : 'UNDELETE',
        );
    }

    getTriggerCaseType(): 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE' {
        return this.triggerCaseType;
    }
}

export const isTriggerCaseType = (
    target: CommonTypeClass<string>,
): target is TriggerCaseTypeClass => {
    return target instanceof TriggerCaseTypeClass;
};
