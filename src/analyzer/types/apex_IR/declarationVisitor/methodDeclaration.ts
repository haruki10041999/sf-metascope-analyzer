import { MethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';
import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type MethodDeclarationType = {
    type: 'methodDeclaration';
    declaration: {
        type: TypeType | 'void';
        name: IdType;
        block: BlockType;
        params?: ParameterType;
    };
};

export const makeMethodDeclarationType = (ctx: MethodDeclarationContext): MethodDeclarationType => {
    if (!ctx.id() || !ctx.block()) {
        throw new Error('値が異常です。MethodDeclarationContext: ' + ctx.getText());
    }

    const methodName = new IdVisitor().visit(ctx.id());
    const block = new BlockVisitor().visit(ctx.block());
    const returnType = ctx.typeRef()
        ? (() => {
              const returnType = new TypeVisitor().visit(ctx.typeRef());
              return returnType;
          })()
        : 'void';

    const methodDeclarationType: MethodDeclarationType = {
        type: 'methodDeclaration',
        declaration: {
            type: returnType,
            name: methodName,
            block: block,
        },
    };

    if (ctx.formalParameters()) {
        const params = new ParameterVisitor().visit(ctx.formalParameters());
        methodDeclarationType.declaration.params = params;
    }

    return methodDeclarationType;
};

