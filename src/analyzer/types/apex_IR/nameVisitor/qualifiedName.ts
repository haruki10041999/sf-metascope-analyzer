import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class QualifiedNameTypeClass extends NameListTypeClass<NormalIdTypeClass> {
    private constructor(value: (NormalIdTypeClass | ErrorTypeClass)[]) {
        super('qualifiedName', value);
    }

    static create(ctx: QualifiedNameContext): QualifiedNameTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。QualifiedNameContext: ' + ctx.getText());
        }

        return new QualifiedNameTypeClass(
            isValidClassList(
                ctx.id_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isNormalIdType,
                'id',
            ),
        );
    }
}

export const isQualifiedNameType = (target: CommonTypeClass): target is QualifiedNameTypeClass => {
    return target instanceof QualifiedNameTypeClass;
};
