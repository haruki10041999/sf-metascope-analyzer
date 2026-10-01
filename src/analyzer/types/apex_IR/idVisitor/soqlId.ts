import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass, IdVisitor, isNormalIdType, NormalIdTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../commonVisitor';

export class SoqlIdTypeClass extends IdTypeClass<NormalIdTypeClass> {
    private constructor(
        value: NormalIdTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('soqlId', value, errorClasses);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。SoqlIdContext: ' + ctx);
        }

        const idTypeClass = new IdVisitor().visit(ctx);

        let value: NormalIdTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        return new SoqlIdTypeClass(value, errorClasses);
    }
}

export const isSoqlIdType = (target: CommonTypeClass): target is SoqlIdTypeClass => {
    return target instanceof SoqlIdTypeClass;
};
