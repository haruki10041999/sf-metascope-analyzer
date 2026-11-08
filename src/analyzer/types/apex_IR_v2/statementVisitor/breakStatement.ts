import { BreakStatementContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type BreakStatementType = TypeField<'breakStatement'> & {
    value: 'break';
};

export class BreakStatementTypeClass extends ApexCommonTypeClass<
    'breakStatement',
    BreakStatementType
> {
    private constructor(value: 'break', sourceSpan: SourceSpan) {
        super('breakStatement', { value: value }, sourceSpan);
    }

    static create(ctx: BreakStatementContext) {
        return new BreakStatementTypeClass('break', getSourceSpan(ctx));
    }
}

export const isBreakStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BreakStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('breakStatement', target);
};
