import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass, IdTypeClass, IdVisitor, isNormalIdType } from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class SoqlIdTypeClass extends IdTypeClass<'soqlId', NormalIdTypeClass> {
    private constructor(value: NormalIdTypeClass | ErrorTypeClass) {
        super('soqlId', value);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        return new SoqlIdTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
        );
    }
}

export const isSoqlIdType = (target: CommonTypeClass<string>): target is SoqlIdTypeClass => {
    return target instanceof SoqlIdTypeClass;
};
