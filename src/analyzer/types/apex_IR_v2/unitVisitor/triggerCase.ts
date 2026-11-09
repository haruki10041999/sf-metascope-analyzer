import { TriggerCaseContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerCaseType = TypeField<'triggerCase'> & {
    actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
    timing: 'BEFORE' | 'AFTER';
};

export class TriggerCaseTypeClass extends ApexCommonTypeClass<'triggerCase', TriggerCaseType> {
    private constructor(fields: FieldsOf<TriggerCaseType>, sourceSpan: SourceSpan) {
        super('triggerCase', fields, sourceSpan);
    }

    static create(ctx: TriggerCaseContext): TriggerCaseTypeClass {
        let actionType: TriggerCaseType['actionType'];
        if (ctx.INSERT()) {
            actionType = 'INSERT';
        } else if (ctx.UPDATE()) {
            actionType = 'UPDATE';
        } else if (ctx.DELETE()) {
            actionType = 'DELETE';
        } else if (ctx.UNDELETE()) {
            actionType = 'UNDELETE';
        } else {
            throw new Error('値が異常です。TriggerCaseContext: ' + ctx.getText());
        }

        return new TriggerCaseTypeClass(
            { actionType, timing: ctx.BEFORE() ? 'BEFORE' : 'AFTER' },
            getSourceSpan(ctx),
        );
    }

    getActionType(): TriggerCaseType['actionType'] {
        return this.getFields().actionType;
    }

    getTiming(): TriggerCaseType['timing'] {
        return this.getFields().timing;
    }
}

export const isTriggerCaseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerCaseTypeClass => isSpicifyApexCommonTypeClass('triggerCase', target);
