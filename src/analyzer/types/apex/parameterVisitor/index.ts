import {
    ApexParserBaseVisitor,
    FormalParameterContext,
    FormalParametersContext,
    SoqlFieldsParameterContext,
} from '@apexdevtools/apex-parser';

import { FormalParameterType, makeFormalParameterType } from './formalParameter';
import { FormalParametersType, makeFormalParametersType } from './formalParameters';
import { SoqlFieldsParameterType, makeSoqlFieldsParameterType } from './soqlFieldsParameter';

export type ParameterType = FormalParameterType | SoqlFieldsParameterType | FormalParametersType;

export class ParameterVisitor extends ApexParserBaseVisitor<ParameterType> {
    visitFormalParameter(ctx: FormalParameterContext) {
        return makeFormalParameterType(ctx);
    }

    visitFormalParameters(ctx: FormalParametersContext) {
        return makeFormalParametersType(ctx);
    }

    visitSoqlFieldsParameter(ctx: SoqlFieldsParameterContext) {
        return makeSoqlFieldsParameterType(ctx);
    }
}

