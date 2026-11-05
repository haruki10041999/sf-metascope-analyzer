import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdTypeClass, IdVisitor, isNormalIdType } from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class SoqlIdTypeClass extends IdTypeClass<'soqlId', NormalIdTypeClass> {
    private constructor(value: NormalIdTypeClass | ApexErrorTypeClass) {
        super('soqlId', value);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        return new SoqlIdTypeClass(visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'));
    }
}

export const isSoqlIdType = (target: ApexCommonTypeClass<string>): target is SoqlIdTypeClass => {
    return target instanceof SoqlIdTypeClass;
};
