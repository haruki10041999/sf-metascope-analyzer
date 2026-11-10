import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from './id';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoqlIdType = TypeField<'soqlId'> & {
    value: IdTypeClass;
};

export class SoqlIdTypeClass extends ApexCommonTypeClass<'soqlId', SoqlIdType> {
    private constructor(fields: FieldsOf<SoqlIdType>, sourceSpan: SourceSpan) {
        super('soqlId', fields, sourceSpan);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        return new SoqlIdTypeClass(
            { value: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id') },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoqlIdType['value'] {
        return this.getFields().value;
    }
}

export const isSoqlIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlIdTypeClass => isSpicifyApexCommonTypeClass('soqlId', target);
