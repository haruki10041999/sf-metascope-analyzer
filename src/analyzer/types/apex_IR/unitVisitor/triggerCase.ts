import { TriggerCaseContext } from '@apexdevtools/apex-parser';

import { UnitTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class TriggerCaseTypeClass extends UnitTypeClass<string> {
    private triggerCaseType: string;
    private constructor(value: string, triggerCaseType: string) {
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

    getTriggerCaseType(): string {
        return this.triggerCaseType;
    }
}

export const isTriggerCaseType = (target: CommonTypeClass): target is TriggerCaseTypeClass => {
    return target instanceof TriggerCaseTypeClass;
};

