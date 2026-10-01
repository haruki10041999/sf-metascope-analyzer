import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class QualifiedNameTypeClass extends NameTypeClass<NormalIdTypeClass[]> {
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
            const idTypeClass = new IdVisitor().visit(idCtx);
            if (isNormalIdType(idTypeClass)) {
                value.push(idTypeClass);
            } else if (isErrorType(idTypeClass)) {
                errorClasses[`value_${index}`] = idTypeClass;
            }
        });

        return new QualifiedNameTypeClass(value, errorClasses);
    }
}

export const isQualifiedNameType = (target: CommonTypeClass): target is QualifiedNameTypeClass => {
    return target instanceof QualifiedNameTypeClass;
};
