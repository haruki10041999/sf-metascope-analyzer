import { InterfaceDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { InterfaceBodyTypeClass, BodyVisitor, isInterfaceBodyType } from '../bodyVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class InterfaceDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private body: InterfaceBodyTypeClass | null = null;
    private extend: TypeListTypeClass | null = null;
    private constructor(
        value: NormalIdTypeClass | null,
        body: InterfaceBodyTypeClass | null,
        extend: TypeListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('interfaceDeclaration', value, errorClasses);
        this.body = body;
        this.extend = extend;
    }

    static create(ctx: InterfaceDeclarationContext): InterfaceDeclarationTypeClass {
        if (!ctx.id() || !ctx.interfaceBody()) {
            throw new Error('値が異常です。InterfaceDeclarationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let body: InterfaceBodyTypeClass | null = null;
        let extend: TypeListTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};
    }

    getBody(): InterfaceBodyTypeClass | null {
        return this.body;
    }

    isBodyNull(): boolean {
        return this.body === null;
    }

    getExtend(): TypeListTypeClass | null {
        return this.extend;
    }

    isExtendNull(): boolean {
        return this.extend === null;
    }
}

export type InterfaceDeclarationType = {
    type: 'interface';
    declaration: {
        name: IdType;
        body: BodyType;
        extends?: ListType;
    };
};

export const makeInterfaceDeclarationType = (
    ctx: InterfaceDeclarationContext,
): InterfaceDeclarationType => {
    if (!ctx.id() || !ctx.interfaceBody()) {
        throw new Error('値が異常です。InterfaceDeclarationContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.id());
    const body = new BodyVisitor().visit(ctx.interfaceBody());

    const interfaceDeclarationType: InterfaceDeclarationType = {
        type: 'interface',
        declaration: {
            name: name,
            body: body,
        },
    };

    if (ctx.EXTENDS() && ctx.typeList()) {
        const extendsList = new ListVisitor().visit(ctx.typeList());
        interfaceDeclarationType.declaration.extends = extendsList;
    }

    return interfaceDeclarationType;
};
