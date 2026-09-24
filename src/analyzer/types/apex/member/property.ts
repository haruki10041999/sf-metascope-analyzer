import {
    PropertyDeclarationContext,
    PropertyBlockContext,
    GetterContext,
    SetterContext,
} from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from '../type';
import { ModifierField, makeModifierField } from '../modifer';
import { StatementField, makeStatementField } from '../statement';

export type PropertyMemberType = {
    type: 'property';
    variantType: TypeField;
    variant: string;
    isGetter: boolean;
    isSetter: boolean;
    getterModifier?: ModifierField[];
    setterModifier?: ModifierField[];
    getterBlockStatement?: StatementField[];
    setterBlockStatement?: StatementField[];
};

export const makePropertyMemberType = (ctx: PropertyDeclarationContext): PropertyMemberType => {
    const variantType = makeTypeField(ctx.typeRef());
    const variant = ctx.id().getText();

    const propertyField: PropertyMemberType = {
        type: 'property',
        variantType: variantType,
        variant: variant,
        isGetter: false,
        isSetter: false,
    };

    ctx.propertyBlock_list().forEach((propertyBlockCtx) => {
        const modifierFields: ModifierField[] = propertyBlockCtx
            .modifier_list()
            .map((modifierCtx) => {
                return makeModifierField(modifierCtx);
            });
        if (propertyBlockCtx.getter()) {
            propertyField.isGetter = true;
            const getterCtx = propertyBlockCtx.getter();

            if (modifierFields.length > 0) {
                propertyField.getterModifier = modifierFields;
            }

            if (getterCtx.block()) {
                propertyField.getterBlockStatement = getterCtx
                    .block()
                    .statement_list()
                    .map((statementCtx) => {
                        return makeStatementField(statementCtx);
                    });
            }
        }

        if (propertyBlockCtx.setter()) {
            const setterCtx = propertyBlockCtx.setter();

            if (modifierFields.length > 0) {
                propertyField.setterModifier = modifierFields;
            }

            if (setterCtx.block()) {
                propertyField.setterBlockStatement = setterCtx
                    .block()
                    .statement_list()
                    .map((statementCtx) => {
                        return makeStatementField(statementCtx);
                    });
            }
        }
    });

    return propertyField;
};

