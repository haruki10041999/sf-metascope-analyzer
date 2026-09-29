import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass, IdVisitor, isIdType } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class SoslIdTypeClass extends IdTypeClass {
    private constructor(id: IdTypeClass[], errorClasses: ErrorTypeClass[]) {
        super('soslId', id, errorClasses);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。SoslIdContext: ' + ctx.getText());
        }

        const id: IdTypeClass[] = [];
        const errorClasses: ErrorTypeClass[] = [];

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isIdType(idTypeClass)) {
            id.push(idTypeClass);
        } else {
            errorClasses.push(idTypeClass);
        }

        if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
            ctx.soslId_list().forEach((soslIdCtx) => {
                const soslIdTypeClass = new IdVisitor().visit(soslIdCtx);
                if (isSoslIdType(soslIdTypeClass)) {
                    id.push(...soslIdTypeClass.getId());
                } else {
                    errorClasses.push(soslIdTypeClass);
                }
            });
        }

        return new SoslIdTypeClass(id, errorClasses);
    }
}

export const isSoslIdType = (target: CommonTypeClass): target is SoslIdTypeClass => {
    return target instanceof SoslIdTypeClass;
};
