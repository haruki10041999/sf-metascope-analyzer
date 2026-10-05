import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdListTypeClass, NormalIdTypeClass, IdVisitor, isNormalIdType } from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class SoslIdTypeClass extends IdListTypeClass<NormalIdTypeClass> {
    private constructor(value: (NormalIdTypeClass | ErrorTypeClass)[]) {
        super('soslId', value);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。SoslIdContext: ' + ctx.getText());
        }

        const value: (NormalIdTypeClass | ErrorTypeClass)[] = [];
        value.push(isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'));

        if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
            const idTypeClassList = isValidClassList(
                ctx.soslId_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isSoslIdType,
                'soslId',
            );

            idTypeClassList.forEach((idTypeClass) => {
                if (isSoslIdType(idTypeClass)) {
                    value.push(...idTypeClass.getValue());
                } else {
                    value.push(idTypeClass);
                }
            });
        }

        return new SoslIdTypeClass(value);
    }
}

export const isSoslIdType = (target: CommonTypeClass): target is SoslIdTypeClass => {
    return target instanceof SoslIdTypeClass;
};
