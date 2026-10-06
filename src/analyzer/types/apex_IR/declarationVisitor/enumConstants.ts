import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { DeclarationListTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class EnumConstantsTypeClass extends DeclarationListTypeClass<NormalIdTypeClass> {
    private constructor(value: (NormalIdTypeClass | ErrorTypeClass)[]) {
        super('enumConstants', value);
    }

    static create(ctx: EnumConstantsContext): EnumConstantsTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。EnumConstantsContext: ' + ctx.getText());
        }

        return new EnumConstantsTypeClass(
            isValidClassList(
                ctx.id_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isNormalIdType,
                'id',
            ),
        );
    }
}

export const isEnumConstantsType = (target: CommonTypeClass): target is EnumConstantsTypeClass => {
    return target instanceof EnumConstantsTypeClass;
};
