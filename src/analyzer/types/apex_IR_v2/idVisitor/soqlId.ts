import { SoqlIdContext } from '@apexdevtools/apex-parser';

import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { IdTypeClass } from './id';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoqlIdType = TypeField<'soqlId'> & {
    value: IdTypeClass;
};

export class SoqlIdTypeClass extends ApexCommonTypeClass<'soqlId', SoqlIdType> {
    private constructor(value: IdTypeClass, sourceSpan: SourceSpan) {
        super('soqlId', { value: value }, sourceSpan);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        return new SoqlIdTypeClass(IdTypeClass.create(ctx.id()), getSourceSpan(ctx));
    }

    getValue(): SoqlIdType['value'] {
        return this.getFields().value;
    }
}

export const isSoqlIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlIdTypeClass => {
    return isSpicifyApexCommonTypeClass('soqlId', target);
};
