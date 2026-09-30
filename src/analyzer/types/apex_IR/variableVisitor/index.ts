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

export { isArrayInitializerType } from './arrayInitializer';
export { isVariableDeclaratorType } from './variableDeclarator';
export { isVariableDeclaratorsType } from './variableDeclarators';
export class VariableTypeClass extends ContextTypeClass {
    constructor(type: string, value: any, errorTypeClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorTypeClasses);
    }
}

export const isVariableTypeAll = (target: CommonTypeClass): target is VariableTypeClass => {
    return target instanceof VariableTypeClass;
};

export class VariableVisitor extends CommonVisitor<VariableTypeClass> {
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
