import { AnyIdContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnyIdType = TypeField<'anyId'> & {
    value: string;
};

export class AnyIdTypeClass extends ApexCommonTypeClass<'anyId', AnyIdType> {
    private constructor(value: string, sourceSpan: SourceSpan) {
        super('anyId', { value: value }, sourceSpan);
    }

    static create(ctx: AnyIdContext): AnyIdTypeClass {
        return new AnyIdTypeClass(ctx.getText(), getSourceSpan(ctx));
    }

    getValue(): AnyIdType['value'] {
        return this.getFields().value;
    }
}

export const isAnyIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnyIdTypeClass => {
    return isSpicifyApexCommonTypeClass('anyId', target);
};
