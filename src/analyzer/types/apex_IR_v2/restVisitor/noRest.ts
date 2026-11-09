import { NoRestContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type NoRestType = TypeField<'noRest'> & {
    /** 文法上は常に `{}` */
    value: '{}';
};

export class NoRestTypeClass extends ApexCommonTypeClass<'noRest', NoRestType> {
    private constructor(fields: FieldsOf<NoRestType>, sourceSpan: SourceSpan) {
        super('noRest', fields, sourceSpan);
    }

    static create(ctx: NoRestContext): NoRestTypeClass {
        return new NoRestTypeClass({ value: '{}' }, getSourceSpan(ctx));
    }

    getValue(): NoRestType['value'] {
        return this.getFields().value;
    }
}

export const isNoRestType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is NoRestTypeClass => isSpicifyApexCommonTypeClass('noRest', target);
