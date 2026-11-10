import { ContinueStatementContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ContinueStatementType = TypeField<'continueStatement'> & {
    value: 'continue';
};
/** @deprecated 綴りの誤り。ContinueStatementType を使う */
export type ContinueStatamentType = ContinueStatementType;

export class ContinueStatementTypeClass extends ApexCommonTypeClass<
    'continueStatement',
    ContinueStatementType
> {
    private constructor(fields: FieldsOf<ContinueStatementType>, sourceSpan: SourceSpan) {
        super('continueStatement', fields, sourceSpan);
    }

    static create(ctx: ContinueStatementContext): ContinueStatementTypeClass {
        return new ContinueStatementTypeClass({ value: 'continue' }, getSourceSpan(ctx));
    }

    getValue(): ContinueStatementType['value'] {
        return this.getFields().value;
    }
}

export const isContinueStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ContinueStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('continueStatement', target);
};
