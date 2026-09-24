import {
    InterfaceDeclarationContext,
    InterfaceBodyContext,
    InterfaceMethodDeclarationContext,
} from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from '../type';
import { ParamField, makeParamList } from '../params';
import { ModifierField, makeModifierField } from '../modifer';

export type InterfaceMemberType = {
    type: 'interface';
    name: string;
    extends?: TypeField[];
    methods: {
        name: string;
        returnType: 'void' | TypeField;
        params: ParamField[];
        modifier?: ModifierField[];
    }[];
};

export const makeInterfaceMemberType = (ctx: InterfaceDeclarationContext): InterfaceMemberType => {
    const name = ctx.id().getText();

    const methods: {
        name: string;
        returnType: 'void' | TypeField;
        params: ParamField[];
        modifier?: ModifierField[];
    }[] = [];
    ctx.interfaceBody()
        .interfaceMethodDeclaration_list()
        .forEach((interfaceMethodDeclarationCtx) => {
            const name = interfaceMethodDeclarationCtx.id().getText();

            let returnType: 'void' | TypeField;
            if (interfaceMethodDeclarationCtx.VOID()) {
                returnType = 'void';
            } else {
                returnType = makeTypeField(interfaceMethodDeclarationCtx.typeRef());
            }

            const params = makeParamList(interfaceMethodDeclarationCtx.formalParameters());

            const method: {
                name: string;
                returnType: 'void' | TypeField;
                params: ParamField[];
                modifier?: ModifierField[];
            } = {
                name: name,
                returnType: returnType,
                params: params,
            };

            if (
                interfaceMethodDeclarationCtx.modifier_list() &&
                interfaceMethodDeclarationCtx.modifier_list().length > 0
            ) {
                method.modifier = interfaceMethodDeclarationCtx
                    .modifier_list()
                    .map((modifierCtx) => {
                        return makeModifierField(modifierCtx);
                    });
            }

            methods.push(method);
        });

    const interfaceField: InterfaceMemberType = {
        type: 'interface',
        name: name,
        methods: methods,
    };

    if (ctx.EXTENDS() && ctx.typeList()) {
        interfaceField.extends = ctx
            .typeList()
            .typeRef_list()
            .map((typeRefCtx) => {
                return makeTypeField(typeRefCtx);
            });
    }

    return interfaceField;
};

