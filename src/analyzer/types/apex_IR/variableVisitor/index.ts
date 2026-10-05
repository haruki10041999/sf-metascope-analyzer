import {
    ApexParserBaseVisitor,
    ArrayInitializerContext,
    VariableDeclaratorContext,
    VariableDeclaratorsContext,
} from '@apexdevtools/apex-parser';

import { ArrayInitializerTypeClass } from './arrayInitializer';
import { VariableDeclaratorTypeClass } from './variableDeclarator';
import { VariableDeclaratorsTypeClass } from './variableDeclarators';

import { CommonVisitor, CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export { isArrayInitializerType, ArrayInitializerTypeClass } from './arrayInitializer';
export { isVariableDeclaratorType, VariableDeclaratorTypeClass } from './variableDeclarator';
export { isVariableDeclaratorsType, VariableDeclaratorsTypeClass } from './variableDeclarators';

export class VariableTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class VariableListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type VariableAllTypeClass = VariableTypeClass<unknown> | VariableListTypeClass<unknown>;

export const isVariableTypeAll = (target: CommonTypeClass): target is VariableAllTypeClass => {
    return target instanceof VariableTypeClass || target instanceof VariableListTypeClass;
};

export class VariableVisitor extends CommonVisitor<VariableAllTypeClass> {
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
