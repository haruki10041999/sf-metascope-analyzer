import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdTypeClass, IdVisitor, isNormalIdType } from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class SoqlIdTypeClass extends IdTypeClass<NormalIdTypeClass> {
    private constructor(value: NormalIdTypeClass | ErrorTypeClass) {
        super('soqlId', value);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。SoqlIdContext: ' + ctx);
        }

        return new SoqlIdTypeClass(isValidClass(new IdVisitor().visit(ctx), isNormalIdType, 'id'));
    }
}

export const isSoqlIdType = (target: CommonTypeClass): target is SoqlIdTypeClass => {
    return target instanceof SoqlIdTypeClass;
};
