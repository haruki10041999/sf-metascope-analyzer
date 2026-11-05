import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { InterfaceBodyTypeClass, BodyVisitor, isInterfaceBodyType } from '../bodyVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class InterfaceDeclarationTypeClass extends DeclarationTypeClass<
    'interfaceDeclaration',
    NormalIdTypeClass
> {
    private body: InterfaceBodyTypeClass | ApexErrorTypeClass;
    private extend: TypeListTypeClass | ApexErrorTypeClass | null = null;
    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        body: InterfaceBodyTypeClass | ApexErrorTypeClass,
        extend: TypeListTypeClass | ApexErrorTypeClass | null,
    ) {
        super('interfaceDeclaration', value);
        this.body = body;
        this.extend = extend;
    }

    static create(ctx: InterfaceDeclarationContext): InterfaceDeclarationTypeClass {
        if (!ctx.id() || !ctx.interfaceBody()) {
            throw new Error('値が異常です。InterfaceDeclarationContext: ' + ctx.getText());
        }

        return new InterfaceDeclarationTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            visitNode(new BodyVisitor(), ctx.interfaceBody(), isInterfaceBodyType, 'body'),
            ctx.EXTENDS() &&
                visitOptionalNode(new ListVisitor(), ctx.typeList(), isTypeListType, 'extend'),
        );
    }

    getBody(): InterfaceBodyTypeClass | ApexErrorTypeClass {
        return this.body;
    }

    getExtend(): TypeListTypeClass | ApexErrorTypeClass | null {
        return this.extend;
    }
}

export const isInterfaceDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is InterfaceDeclarationTypeClass => {
    return target instanceof InterfaceDeclarationTypeClass;
};
