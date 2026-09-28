import {
    ApexParserBaseVisitor,
    ArraySubscriptsContext,
    TypeRefContext,
} from '@apexdevtools/apex-parser';

import { ArraySubscriptsType, makeArraySubscriptsType } from './arraySubscripts';
import { TypeRefType, makeTypeRefType } from './typeRef';

export type TypeType = ArraySubscriptsType | TypeRefType;

export class TypeVisitor extends ApexParserBaseVisitor<TypeType> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        return makeArraySubscriptsType(ctx);
    }

    visitTypeRef(ctx: TypeRefContext) {
        return makeTypeRefType(ctx);
    }
}
