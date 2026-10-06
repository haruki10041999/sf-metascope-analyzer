import { ClassBodyContext, InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { ClassBodyTypeClass } from './classBody';
import { InterfaceBodyTypeClass } from './interfaceBody';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isClassBodyType, ClassBodyTypeClass } from './classBody';
export { isInterfaceBodyType, InterfaceBodyTypeClass } from './interfaceBody';

export class BodyTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isBodyTypeAll = (target: CommonTypeClass): target is BodyTypeClass<unknown> => {
    return target instanceof BodyTypeClass;
};

export class BodyVisitor extends CommonVisitor<BodyTypeClass<unknown>> {
    visitClassBody(ctx: ClassBodyContext) {
        return ClassBodyTypeClass.create(ctx);
    }

    visitInterfaceBody(ctx: InterfaceBodyContext) {
        return InterfaceBodyTypeClass.create(ctx);
    }
}
