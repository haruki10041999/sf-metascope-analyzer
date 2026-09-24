import {
    NewExpressionContext,
    CreatorContext,
    CreatedNameContext,
    IdCreatedNamePairContext,
    NoRestContext,
    ClassCreatorRestContext,
    ArgumentsContext,
    ArrayCreatorRestContext,
    ArrayInitializerContext,
    MapCreatorRestContext,
    MapCreatorRestPairContext,
    SetCreatorRestContext,
} from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

type InstanceField =
    | {
          instanceType: string;
          genericTypes?: TypeField[];
      }
    | {
          instanceType: 'array';
          genericType: TypeField;
      }
    | {
          instanceType: 'map';
          keyType: TypeField;
          valueType: TypeField;
      };

export type NewExpressionType = {
    type: 'new';
} & (
    | {}
    | {
          instanceType: InstanceField;
          params?: ExpressionField[];
          initializeExpression?: ExpressionField[];
      }
);

export const makeNewExpressionType = (ctx: NewExpressionContext): NewExpressionType => {
    const visitor = new ExpressionVisitor();

    if (ctx.creator().noRest()) {
        return {
            type: 'new',
        };
    }

    const createdNameCtx = ctx.creator().createdName();

    if (ctx.creator().classCreatorRest()) {
        const instanceType = createdNameCtx
            .idCreatedNamePair_list()
            .map((pair) => pair.anyId().getText())
            .join('.');

        const instanceField: InstanceField = {
            instanceType: instanceType,
        };

        if (createdNameCtx.idCreatedNamePair_list().at(-1)!.typeList()) {
            instanceField.genericTypes = createdNameCtx
                .idCreatedNamePair_list()
                .at(-1)!
                .typeList()
                .typeRef_list()
                .map((typRefCtx) => makeTypeField(typRefCtx));
        }

        const newExpressionType: NewExpressionType = {
            type: 'new',
            instanceType: instanceField,
        };

        if (ctx.creator().classCreatorRest().arguments()) {
            newExpressionType.params = ctx
                .creator()
                .classCreatorRest()
                .arguments()
                .expressionList()
                .expression_list()
                .map((expressionCtx) => visitor.visit(expressionCtx));
        }

        return newExpressionType;
    }

    if (ctx.creator().arrayCreatorRest()) {
        const instanceField: InstanceField = {
            instanceType: 'array',
            genericType: makeTypeField(createdNameCtx.idCreatedNamePair(0).typeList().typeRef(0)),
        };

        const newExpressionType: NewExpressionType = {
            type: 'new',
            instanceType: instanceField,
        };

        if (ctx.creator().arrayCreatorRest().arrayInitializer()) {
            newExpressionType.initializeExpression = ctx
                .creator()
                .arrayCreatorRest()
                .arrayInitializer()
                .expression_list()
                .map((expressionCtx) => visitor.visit(expressionCtx));
        }

        return newExpressionType;
    }
    // Handle array creator rest
    if (ctx.creator().mapCreatorRest()) {
    }
    // Handle map creator rest
    if (ctx.creator().setCreatorRest()) {
    }
};
