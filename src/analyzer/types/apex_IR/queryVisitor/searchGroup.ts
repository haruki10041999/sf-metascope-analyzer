import { SearchGroupContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

type SearchGroupValueType = 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';

export type SearchGroupType = TypeField<'searchGroup'> & {
    value: SearchGroupValueType;
};

export class SearchGroupTypeClass extends ApexCommonTypeClass<'searchGroup', SearchGroupType> {
    private constructor(fields: FieldsOf<SearchGroupType>, sourceSpan: SourceSpan) {
        super('searchGroup', fields, sourceSpan);
    }

    static create(ctx: SearchGroupContext): SearchGroupTypeClass {
        if (!ctx.ALL() && !ctx.EMAIL() && !ctx.NAME() && !ctx.PHONE() && !ctx.SIDEBAR()) {
            throw new Error('値が異常です。SearchGroupContext: ' + ctx.getText());
        }

        let value: SearchGroupValueType;

        if (ctx.ALL()) {
            value = 'ALL';
        } else if (ctx.EMAIL()) {
            value = 'EMAIL';
        } else if (ctx.NAME()) {
            value = 'NAME';
        } else if (ctx.PHONE()) {
            value = 'PHONE';
        } else {
            value = 'SIDEBAR';
        }

        return new SearchGroupTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): SearchGroupType['value'] {
        return this.getFields().value;
    }
}

export const isSearchGroupType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SearchGroupTypeClass => {
    return isSpicifyApexCommonTypeClass('searchGroup', target);
};
