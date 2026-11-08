import { TriggerCaseContext } from '@apexdevtools/apex-parser';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TriggerCaseType = TypeField<'triggerCase'> & {
    actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
    timing: 'BEFORE' | 'AFTER';
};

export class TriggerCaseTypeClass extends ApexCommonTypeClass<'triggerCase', TriggerCaseType> {
    private constructor(
        actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE',
        timing: 'BEFORE' | 'AFTER',
        sourceSpan: SourceSpan,
    ) {
        super('triggerCase', { actionType: actionType, timing: timing }, sourceSpan);
    }

    static create(ctx: TriggerCaseContext): TriggerCaseTypeClass {
        return new TriggerCaseTypeClass(
            ctx.INSERT()
                ? 'INSERT'
                : ctx.UPDATE()
                  ? 'UPDATE'
                  : ctx.DELETE()
                    ? 'DELETE'
                    : 'UNDELETE',
            ctx.BEFORE() ? 'BEFORE' : 'AFTER',
            getSourceSpan(ctx),
        );
    }
}

export const isTriggerCaseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerCaseTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerCase', target);
};
