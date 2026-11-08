import { ContinueStatementContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ContinueStatamentType = TypeField<'continueStatement'> & {
    value: 'continue';
};

export class ContinueStatementTypeClass extends ApexCommonTypeClass<
    'continueStatement',
    ContinueStatamentType
> {
    private constructor(value: 'continue', sourceSpan: SourceSpan) {
        super('continueStatement', { value: value }, sourceSpan);
    }

    static create(ctx: ContinueStatementContext) {
        return new ContinueStatementTypeClass('continue', getSourceSpan(ctx));
    }
}

export const isContinueStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ContinueStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('continueStatement', target);
};
