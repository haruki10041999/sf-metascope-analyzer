import {
    ApexParserBaseVisitor,
    ClassBodyContext,
    InterfaceBodyContext,
} from '@apexdevtools/apex-parser';

import { ClassBodyType, makeClassBodyType } from './classBody';
import { InterfaceBodyType, makeInterfaceBodyType } from './interfaceBody';

export type BodyType = ClassBodyType | InterfaceBodyType;

export class BodyVisitor extends ApexParserBaseVisitor<BodyType> {
    visitClassBodyContext(ctx: ClassBodyContext) {
        return makeClassBodyType(ctx);
    }

    visitInterfaceBodyContext(ctx: InterfaceBodyContext) {
        return makeInterfaceBodyType(ctx);
    }
}
