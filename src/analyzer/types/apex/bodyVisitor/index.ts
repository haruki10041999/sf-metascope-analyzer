import {
    ApexParserBaseVisitor,
    ClassBodyContext,
    InterfaceBodyContext,
} from '@apexdevtools/apex-parser';

import { ClassBodyType, makeClassBodyType } from './classBody';
import { InterfaceBodyType, makeInterfaceBodyType } from './interfaceBody';

export type BodyType = ClassBodyType | InterfaceBodyType;

export class BodyVisitor extends ApexParserBaseVisitor<BodyType> {
    visitClassBody(ctx: ClassBodyContext) {
        return makeClassBodyType(ctx);
    }

    visitInterfaceBody(ctx: InterfaceBodyContext) {
        return makeInterfaceBodyType(ctx);
    }
}
