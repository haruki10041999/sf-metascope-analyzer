import { MethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

import { FormalParametersType, makeFormalParametersType } from '../formalParameters';
import { TypeRefType, makeTypeRefType } from '../typeRef';

export type MethodDeclarationType = {
    type: 'methoDeclaration';
    methodName: Omit<IdType, 'type'>;
    block: Omit<BlockType, 'type'>;
    returnType: Omit<TypeRefType, 'type'> | 'void';
    params?: Omit<FormalParametersType, 'type'>;
};

export const makeMethodDeclarationType = (ctx: MethodDeclarationContext): MethodDeclarationType => {
    const { type: _, ...methodName } = new IdVisitor().visit(ctx.id());
    const { type: __, ...block } = new BlockVisitor().visit(ctx.block());
    const returnType = ctx.typeRef()
        ? (() => {
              const { type, ...returnType } = makeTypeRefType(ctx.typeRef());
              return returnType;
          })()
        : 'void';

    const methodDeclarationType: MethodDeclarationType = {
        type: 'methoDeclaration',
        methodName: methodName,
        block: block,
        returnType: returnType,
    };

    if (ctx.formalParameters()) {
        const { type, ...params } = makeFormalParametersType(ctx.formalParameters());
        methodDeclarationType.params = params;
    }

    return methodDeclarationType;
};
