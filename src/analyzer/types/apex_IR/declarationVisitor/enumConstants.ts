import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { DeclarationListTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class EnumConstantsTypeClass extends DeclarationListTypeClass<
    'enumConstants',
    NormalIdTypeClass
> {
    private constructor(value: (NormalIdTypeClass | ApexErrorTypeClass)[]) {
        super('enumConstants', value);
    }

    static create(ctx: EnumConstantsContext): EnumConstantsTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。EnumConstantsContext: ' + ctx.getText());
        }

        return new EnumConstantsTypeClass(
            visitNodeList(new IdVisitor(), ctx.id_list(), isNormalIdType, 'id'),
        );
    }
}

export const isEnumConstantsType = (
    target: ApexCommonTypeClass<string>,
): target is EnumConstantsTypeClass => {
    return target instanceof EnumConstantsTypeClass;
};
