import { QualifiedNameContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type QualifiedNameType = TypeField<'qualifiedName'> & {
    value: IdTypeClass[];
};

export class QualifiedNameTypeClass extends ApexCommonTypeClass<
    'qualifiedName',
    QualifiedNameType
> {
    private constructor(fields: FieldsOf<QualifiedNameType>, sourceSpan: SourceSpan) {
        super('qualifiedName', fields, sourceSpan);
    }

    static create(ctx: QualifiedNameContext): QualifiedNameTypeClass {
        return new QualifiedNameTypeClass(
            { value: createNodeList(ctx.id_list(), (c) => IdTypeClass.create(c), 'id') },
            getSourceSpan(ctx),
        );
    }

    getValue(): QualifiedNameType['value'] {
        return this.getFields().value;
    }
}

export const isQualifiedNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is QualifiedNameTypeClass => isSpicifyApexCommonTypeClass('qualifiedName', target);
