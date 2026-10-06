import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { InterfaceBodyTypeClass, BodyVisitor, isInterfaceBodyType } from '../bodyVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class InterfaceDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private body: InterfaceBodyTypeClass | ErrorTypeClass;
    private extend: TypeListTypeClass | ErrorTypeClass | null = null;
    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        body: InterfaceBodyTypeClass | ErrorTypeClass,
        extend: TypeListTypeClass | ErrorTypeClass | null,
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new BodyVisitor().visit(ctx.interfaceBody()), isInterfaceBodyType, 'body'),
            ctx.EXTENDS() && ctx.typeList()
                ? isValidClass(new ListVisitor().visit(ctx.typeList()), isTypeListType, 'extend')
                : null,
        );
    }

    getBody(): InterfaceBodyTypeClass | ErrorTypeClass {
        return this.body;
    }

    getExtend(): TypeListTypeClass | ErrorTypeClass | null {
        return this.extend;
    }
}

export const isInterfaceDeclarationType = (
    target: CommonTypeClass,
): target is InterfaceDeclarationTypeClass => {
    return target instanceof InterfaceDeclarationTypeClass;
};
