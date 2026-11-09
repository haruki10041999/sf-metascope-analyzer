import { EnumDeclarationContext } from '@apexdevtools/apex-parser';

import { EnumConstantsTypeClass } from './enumConstants';

import { IdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type EnumDeclarationType = TypeField<'enumDeclaration'> & {
    name: IdTypeClass;
    /** `enum E {}` のように定数がなければ null */
    constants: EnumConstantsTypeClass | null;
};

export class EnumDeclarationTypeClass extends ApexCommonTypeClass<
    'enumDeclaration',
    EnumDeclarationType
> {
    private constructor(fields: FieldsOf<EnumDeclarationType>, sourceSpan: SourceSpan) {
        super('enumDeclaration', fields, sourceSpan);
    }

    static create(ctx: EnumDeclarationContext): EnumDeclarationTypeClass {
        return new EnumDeclarationTypeClass(
            {
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                constants: createOptionalNode(
                    ctx.enumConstants(),
                    (c) => EnumConstantsTypeClass.create(c),
                    'enumConstants',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getName(): EnumDeclarationType['name'] {
        return this.getFields().name;
    }

    getConstants(): EnumDeclarationType['constants'] {
        return this.getFields().constants;
    }
}

export const isEnumDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is EnumDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('enumDeclaration', target);
};
