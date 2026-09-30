import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class QualifiedNameTypeClass extends NameTypeClass {
    private constructor(value: NormalIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('qualifiedName', value, errorClasses);
    }

    static create(ctx: QualifiedNameContext): QualifiedNameTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。QualifiedNameContext: ' + ctx.getText());
        }

        const value: NormalIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.id_list().forEach((idCtx, index) => {
            const normalIdTypeClass = new IdVisitor().visit(idCtx);
            if (isNormalIdType(normalIdTypeClass)) {
                value.push(normalIdTypeClass);
            } else {
                errorClasses[`value_${index}`] = normalIdTypeClass;
            }
        });

        return new QualifiedNameTypeClass(value, errorClasses);
    }
}

export const isQualifiedNameType = (target: CommonTypeClass): target is QualifiedNameTypeClass => {
    return target instanceof QualifiedNameTypeClass;
};
