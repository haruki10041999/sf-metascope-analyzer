import {
    TypeRefContext,
    TypeNameContext,
    TypeArgumentsContext,
    TypeListContext,
    ArraySubscriptsContext,
} from '@apexdevtools/apex-parser';

type CommonPrimitiveType =
    | 'Id'
    | 'String'
    | 'Double'
    | 'Integer'
    | 'Long'
    | 'Boolean'
    | 'Date'
    | 'DateTime'
    | 'Time'
    | 'Decimal'
    | 'Blob'
    | 'Object';

const COMMON_PRIMITIVE_TYPES: string[] = [
    'Id',
    'String',
    'Double',
    'Integer',
    'Long',
    'Boolean',
    'Date',
    'DateTime',
    'Time',
    'Decimal',
    'Blob',
    'Object',
];

export type TypeField =
    | {
          type: 'primititve';
          fieldType: CommonPrimitiveType;
      }
    | {
          type: 'custom';
          fieldType: string;
      }
    | {
          type: 'list' | 'set';
          fieldType: TypeField;
      }
    | {
          type: 'map';
          keyType: TypeField;
          valueType: TypeField;
      }
    | {
          type: 'array';
          fieldType: TypeField;
          dimension: number;
      };

export const makeTypeField = (ctx: TypeRefContext): TypeField => {
    if (ctx.arraySubscripts()) {
        const dimension = ctx.arraySubscripts().LBRACK_list().length;
        const fieldType = ctx
            .typeName_list()
            .map((typeNameCtx) => typeNameCtx.id().getText())
            .join('.');

        let singleTypeField: TypeField;
        if (COMMON_PRIMITIVE_TYPES.includes(fieldType)) {
            singleTypeField = {
                type: 'primititve',
                fieldType: fieldType as CommonPrimitiveType,
            };
        } else {
            singleTypeField = {
                type: 'custom',
                fieldType: fieldType,
            };
        }
        return {
            type: 'array',
            fieldType: singleTypeField,
            dimension: dimension,
        };
    }

    const typeNameCtxs = ctx.typeName_list();
    if (typeNameCtxs.length > 1) {
        const fieldType = ctx
            .typeName_list()
            .map((typeNameCtx) => typeNameCtx.id().getText())
            .join('.');
        if (COMMON_PRIMITIVE_TYPES.includes(fieldType)) {
            return {
                type: 'primititve',
                fieldType: fieldType as CommonPrimitiveType,
            };
        } else {
            return {
                type: 'custom',
                fieldType: fieldType,
            };
        }
    }

    const typeNameCtx = typeNameCtxs.at(0)!;

    if (typeNameCtx.LIST() || typeNameCtx.SET() || typeNameCtx.MAP()) {
        const typeListCtx = typeNameCtx.typeArguments().typeList();
        const typeRefCtxs = typeListCtx.typeRef_list();

        if (typeRefCtxs.length === 1) {
            if (typeNameCtx.LIST()) {
                return {
                    type: 'list',
                    fieldType: makeTypeField(typeRefCtxs.at(0)!),
                };
            }

            if (typeNameCtx.SET()) {
                return {
                    type: 'set',
                    fieldType: makeTypeField(typeRefCtxs.at(0)!),
                };
            }
        }

        if (typeRefCtxs.length === 2 && typeNameCtx.MAP()) {
            return {
                type: 'map',
                keyType: makeTypeField(typeRefCtxs.at(0)!),
                valueType: makeTypeField(typeRefCtxs.at(1)!),
            };
        }
    }

    if (typeNameCtx.id()) {
        const fieldType = ctx
            .typeName_list()
            .map((typeNameCtx) => typeNameCtx.id().getText())
            .join('.');
        if (COMMON_PRIMITIVE_TYPES.includes(fieldType)) {
            return {
                type: 'primititve',
                fieldType: fieldType as CommonPrimitiveType,
            };
        } else {
            return {
                type: 'custom',
                fieldType: fieldType,
            };
        }
    }

    throw new Error(`値が異常です。TypeRefContext:${ctx.getText()}`);
};
