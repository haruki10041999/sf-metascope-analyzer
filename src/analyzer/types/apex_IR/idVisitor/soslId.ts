import { SoslIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass, NormalIdTypeClass, IdVisitor, isNormalIdType } from '.';

import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../commonVisitor';

export class SoslIdTypeClass extends IdTypeClass<NormalIdTypeClass[]> {
    private constructor(value: NormalIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('soslId', value, errorClasses);
    }

    static create(ctx: SoslIdContext): SoslIdTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。SoslIdContext: ' + ctx.getText());
        }

        const value: NormalIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value.push(idTypeClass);
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        if (ctx.soslId_list() && ctx.soslId_list().length > 0) {
            ctx.soslId_list().forEach((soslIdCtx) => {
                const soslIdTypeClass = new IdVisitor().visit(soslIdCtx);
                if (isSoslIdType(soslIdTypeClass)) {
                    value.push(...(soslIdTypeClass.getValue() || []));
                } else if (isErrorType(soslIdTypeClass)) {
                    errorClasses['value'] = soslIdTypeClass;
                }
            });
        }

        return new SoslIdTypeClass(value, errorClasses);
    }
}

export const isSoslIdType = (target: CommonTypeClass): target is SoslIdTypeClass => {
    return target instanceof SoslIdTypeClass;
};
