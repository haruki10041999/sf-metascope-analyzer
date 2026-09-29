import { TriggerCaseContext } from '@apexdevtools/apex-parser';

export type TriggerCaseType = {
    type: 'triggerCase';
    beforAfter: 'BEFORE' | 'AFTER';
    triggerType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
};

export const makeTriggerCaseType = (ctx: TriggerCaseContext): TriggerCaseType => {
    let beforeAfter: 'BEFORE' | 'AFTER' | undefined = undefined;

    if (ctx.BEFORE()) {
        beforeAfter = 'BEFORE';
    }

    if (ctx.AFTER()) {
        beforeAfter = 'AFTER';
    }

    let triggerType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE' | undefined = undefined;

    if (ctx.INSERT()) {
        triggerType = 'INSERT';
    }

    if (ctx.UPDATE()) {
        triggerType = 'UPDATE';
    }

    if (ctx.DELETE()) {
        triggerType = 'DELETE';
    }

    if (ctx.UNDELETE()) {
        triggerType = 'UNDELETE';
    }

    if (!beforeAfter || !triggerType) {
        throw new Error('値が異常です。TriggerCaseContext: ' + ctx.getText());
    }

    return {
        type: 'triggerCase',
        beforAfter: beforeAfter,
        triggerType: triggerType,
    };
};
