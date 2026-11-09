import { BreakStatementContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type BreakStatementType = TypeField<'breakStatement'> & {
    value: 'break';
};

export class BreakStatementTypeClass extends ApexCommonTypeClass<
    'breakStatement',
    BreakStatementType
> {
    private constructor(fields: FieldsOf<BreakStatementType>, sourceSpan: SourceSpan) {
        super('breakStatement', fields, sourceSpan);
    }

    static create(ctx: BreakStatementContext): BreakStatementTypeClass {
        return new BreakStatementTypeClass({ value: 'break' }, getSourceSpan(ctx));
    }

    getValue(): BreakStatementType['value'] {
        return this.getFields().value;
    }
}

export const isBreakStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BreakStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('breakStatement', target);
};
