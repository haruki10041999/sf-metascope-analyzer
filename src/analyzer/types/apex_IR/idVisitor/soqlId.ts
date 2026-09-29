import { SoqlIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass, IdVisitor, isIdType } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class SoqlIdTypeClass extends IdTypeClass {
    private constructor(id: IdTypeClass | null, errorClasses: ErrorTypeClass[]) {
        super('soqlId', id, errorClasses);
    }

    static create(ctx: SoqlIdContext): SoqlIdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。SoqlIdContext: ' + ctx);
        }

        const idTypeClass = new IdVisitor().visit(ctx);

        let id: IdTypeClass | null = null;
        const errorClasses: ErrorTypeClass[] = [];
        if (isIdType(idTypeClass)) {
            id = idTypeClass;
        } else {
            errorClasses.push(idTypeClass);
        }

        return new SoqlIdTypeClass(id, errorClasses);
    }
}

export const isSoqlIdType = (target: CommonTypeClass): target is SoqlIdTypeClass => {
    return target instanceof SoqlIdTypeClass;
};
