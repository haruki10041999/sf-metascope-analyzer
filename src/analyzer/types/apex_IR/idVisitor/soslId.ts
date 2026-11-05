import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdListTypeClass, NormalIdTypeClass, IdVisitor, isNormalIdType } from '.';

import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class SoslIdTypeClass extends IdListTypeClass<'soslId', NormalIdTypeClass> {
    private constructor(value: (NormalIdTypeClass | ApexErrorTypeClass)[]) {
        super('soslId', value);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。SoslIdContext: ' + ctx.getText());
        }

        const value: (NormalIdTypeClass | ApexErrorTypeClass)[] = [];
        value.push(visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'));

        if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
            const idTypeClassList = visitNodeList(
                new IdVisitor(),
                ctx.soslId_list(),
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

export const isSoslIdType = (target: ApexCommonTypeClass<string>): target is SoslIdTypeClass => {
    return target instanceof SoslIdTypeClass;
};
