import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { InterfaceBodyTypeClass } from '../bodyVisitor';
import { TypeListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type InterfaceDeclarationType = TypeField<'interfaceDeclaration'> & {
    name: IdTypeClass;
    extend: TypeListTypeClass | null;
    body: InterfaceBodyTypeClass;
};

export class InterfaceDeclarationTypeClass extends ApexCommonTypeClass<
    'interfaceDeclaration',
    InterfaceDeclarationType
> {
    private constructor(fields: FieldsOf<InterfaceDeclarationType>, sourceSpan: SourceSpan) {
        super('interfaceDeclaration', fields, sourceSpan);
    }

    static create(ctx: InterfaceDeclarationContext): InterfaceDeclarationTypeClass {
        return new InterfaceDeclarationTypeClass(
            {
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                extend: ctx.EXTENDS()
                    ? createNode(ctx.typeList(), (c) => TypeListTypeClass.create(c), 'typeList')
                    : null,
                body: createNode(
                    ctx.interfaceBody(),
                    (c) => InterfaceBodyTypeClass.create(c),
                    'interfaceBody',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getName(): InterfaceDeclarationType['name'] {
        return this.getFields().name;
    }

    getExtend(): InterfaceDeclarationType['extend'] {
        return this.getFields().extend;
    }

    getBody(): InterfaceDeclarationType['body'] {
        return this.getFields().body;
    }
}

export const isInterfaceDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InterfaceDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('interfaceDeclaration', target);
};
