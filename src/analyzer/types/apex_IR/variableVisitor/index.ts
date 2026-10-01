import {
    ApexParserBaseVisitor,
    ArrayInitializerContext,
    VariableDeclaratorContext,
    VariableDeclaratorsContext,
} from '@apexdevtools/apex-parser';

import { ArrayInitializerTypeClass } from './arrayInitializer';
import { VariableDeclaratorTypeClass } from './variableDeclarator';
import { VariableDeclaratorsTypeClass } from './variableDeclarators';

import { ContextTypeClass, CommonVisitor, CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export { isArrayInitializerType, ArrayInitializerTypeClass } from './arrayInitializer';
export { isVariableDeclaratorType, VariableDeclaratorTypeClass } from './variableDeclarator';
export { isVariableDeclaratorsType, VariableDeclaratorsTypeClass } from './variableDeclarators';
export class VariableTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorTypeClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorTypeClasses);
    }
}

export const isVariableTypeAll = (
    target: CommonTypeClass,
): target is VariableTypeClass<unknown> => {
    return target instanceof VariableTypeClass;
};

export class VariableVisitor extends CommonVisitor<VariableTypeClass<unknown>> {
    visitArrayInitializer(ctx: ArrayInitializerContext) {
        return ArrayInitializerTypeClass.create(ctx);
    }

    visitVariableDeclarator(ctx: VariableDeclaratorContext) {
        return VariableDeclaratorTypeClass.create(ctx);
    }

    visitVariableDeclarators(ctx: VariableDeclaratorsContext) {
        return VariableDeclaratorsTypeClass.create(ctx);
    }
}
