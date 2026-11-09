import { IdPrimaryContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type IdPrimaryType = TypeField<'idPrimary'> & {
    value: IdTypeClass;
};

export class IdPrimaryTypeClass extends ApexCommonTypeClass<'idPrimary', IdPrimaryType> {
    private constructor(fields: FieldsOf<IdPrimaryType>, sourceSpan: SourceSpan) {
        super('idPrimary', fields, sourceSpan);
    }

    static create(ctx: IdPrimaryContext): IdPrimaryTypeClass {
        return new IdPrimaryTypeClass(
            { value: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id') },
            getSourceSpan(ctx),
        );
    }

    getValue(): IdPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isIdPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is IdPrimaryTypeClass => isSpicifyApexCommonTypeClass('idPrimary', target);
