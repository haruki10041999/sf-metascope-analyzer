import {
    ApexParserBaseVisitor,
    FormalParameterContext,
    SoqlFieldsParameterContext,
} from '@apexdevtools/apex-parser';

import { FormalParameterType, makeFormalParameterType } from './formalParameter';
import { SoqlFieldsParameterType, makeSoqlFieldsParameterType } from './soqlFieldsParameter';

export type ParameterType = FormalParameterType | SoqlFieldsParameterType;

export class ParameterVisitor extends ApexParserBaseVisitor<ParameterType> {
    visitFormalParameter(ctx: FormalParameterContext) {
        return makeFormalParameterType(ctx);
    }

    visitSoqlFieldsParameter(ctx: SoqlFieldsParameterContext) {
        return makeSoqlFieldsParameterType(ctx);
    }
}
