import { SoslIdContext } from '@apexdevtools/apex-parser';

import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNodeList,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { IdTypeClass } from './id';
import { SourceSpan } from '../../commons';

export type SoslIdType = TypeField<'soslId'> & {
    value: IdTypeClass[];
};

export class SoslIdTypeClass extends ApexCommonTypeClass<'soslId', SoslIdType> {
    private constructor(value: IdTypeClass[], sourceSpan: SourceSpan) {
        super('soslId', { value: value }, sourceSpan);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        const value: IdTypeClass[] = [IdTypeClass.create(ctx.id())];

        if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
            ctx.soslId_list().forEach((s) => {
                value.push(...SoslIdTypeClass.create(s).getValue());
            });
        }

        return new SoslIdTypeClass(value, getSourceSpan(ctx));
    }

    getValue(): SoslIdType['value'] {
        return this.getFields().value;
    }
}

export const isSoslIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslIdTypeClass => {
    return isSpicifyApexCommonTypeClass('soslId', target);
};
