import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from './id';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoslIdType = TypeField<'soslId'> & {
    /** `a.b.c` を平坦化した id の並び */
    value: IdTypeClass[];
};

export class SoslIdTypeClass extends ApexCommonTypeClass<'soslId', SoslIdType> {
    private constructor(fields: FieldsOf<SoslIdType>, sourceSpan: SourceSpan) {
        super('soslId', fields, sourceSpan);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        const value: SoslIdType['value'] = [
            createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
        ];

        // 入れ子の soslId は平坦化する
        ctx.soslId_list().forEach((nestedCtx) => {
            const nested = createNode(nestedCtx, (c) => SoslIdTypeClass.create(c), 'soslId');
            if (isSoslIdType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        });

        return new SoslIdTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): SoslIdType['value'] {
        return this.getFields().value;
    }
}

export const isSoslIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslIdTypeClass => isSpicifyApexCommonTypeClass('soslId', target);
