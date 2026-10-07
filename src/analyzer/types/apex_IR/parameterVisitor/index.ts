import {
    ApexParserBaseVisitor,
    FormalParameterContext,
    FormalParametersContext,
    SoqlFieldsParameterContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ParameterTypeClass } from './base';

import { FormalParameterTypeClass } from './formalParameter';
import { FormalParametersTypeClass } from './formalParameters';
import { SoqlFieldsParameterTypeClass } from './soqlFieldsParameter';

import { CommonVisitor } from '../commonVisitor';

export { isFormalParameterType, FormalParameterTypeClass } from './formalParameter';
export { isSoqlFieldsParameterType, SoqlFieldsParameterTypeClass } from './soqlFieldsParameter';
export { isFormalParametersType, FormalParametersTypeClass } from './formalParameters';

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

