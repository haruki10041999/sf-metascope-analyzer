import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class QualifiedNameTypeClass extends NameListTypeClass<'qualifiedName', NormalIdTypeClass> {
    private constructor(value: (NormalIdTypeClass | ApexErrorTypeClass)[]) {
        super('qualifiedName', value);
    }

    static create(ctx: QualifiedNameContext): QualifiedNameTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。QualifiedNameContext: ' + ctx.getText());
        }

        return new QualifiedNameTypeClass(
            visitNodeList(new IdVisitor(), ctx.id_list(), isNormalIdType, 'id'),
        );
    }
}

export const isQualifiedNameType = (
    target: ApexCommonTypeClass<string>,
): target is QualifiedNameTypeClass => {
    return target instanceof QualifiedNameTypeClass;
};
