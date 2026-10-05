import {
    ApexParserBaseVisitor,
    FormalParameterContext,
    FormalParametersContext,
    SoqlFieldsParameterContext,
} from '@apexdevtools/apex-parser';

import { FormalParameterTypeClass } from './formalParameter';
import { FormalParametersTypeClass } from './formalParameters';
import { SoqlFieldsParameterTypeClass } from './soqlFieldsParameter';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isFormalParameterType, FormalParameterTypeClass } from './formalParameter';
export { isSoqlFieldsParameterType, SoqlFieldsParameterTypeClass } from './soqlFieldsParameter';
export { isFormalParametersType, FormalParametersTypeClass } from './formalParameters';

export class ParameterTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isParameterTypeAll = (
    target: CommonTypeClass,
): target is ParameterTypeClass<unknown> => {
    return target instanceof ParameterTypeClass;
};

export class ParameterVisitor extends CommonVisitor<ParameterTypeClass<unknown>> {
    visitFormalParameter(ctx: FormalParameterContext) {
        return FormalParameterTypeClass.create(ctx);
    }

    visitFormalParameters(ctx: FormalParametersContext) {
        return FormalParametersTypeClass.create(ctx);
    }

    visitSoqlFieldsParameter(ctx: SoqlFieldsParameterContext) {
        return SoqlFieldsParameterTypeClass.create(ctx);
    }
}
