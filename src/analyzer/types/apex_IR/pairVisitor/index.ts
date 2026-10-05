import {
    ApexParserBaseVisitor,
    ElementValuePairContext,
    IdCreatedNamePairContext,
    MapCreatorRestPairContext,
    ElementValuePairsContext,
} from '@apexdevtools/apex-parser';

import { ElementValuePairTypeClass } from './elementValuePair';
import { IdCreatedNamePairTypeClass } from './idCreatedNamePair';
import { MapCreatorRestPairTypeClass } from './mapCreatorRestPair';
import { ElementValuePairsTypeClass } from './elementValuePairs';

import { ErrorTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isElementValuePairType, ElementValuePairTypeClass } from './elementValuePair';
export { isIdCreatedNamePairType, IdCreatedNamePairTypeClass } from './idCreatedNamePair';
export { isMapCreatorRestPairType, MapCreatorRestPairTypeClass } from './mapCreatorRestPair';
export { isElementValuePairsType, ElementValuePairsTypeClass } from './elementValuePairs';

export class PairTypeClass<Tleft, Tright> extends CommonTypeClass {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;

    constructor(type: string, left: Tleft | ErrorTypeClass, right: Tright | ErrorTypeClass) {
        super(type);
        this.left = left;
        this.right = right;
    }

    getLeft(): Tleft | ErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ErrorTypeClass {
        return this.right;
    }
}

export class PairListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type PairAllTypeClass = PairTypeClass<unknown, unknown> | PairListTypeClass<unknown>;

export const isPairTypeAll = (target: CommonTypeClass): target is PairAllTypeClass => {
    return target instanceof PairTypeClass || target instanceof PairListTypeClass;
};

export class PairVisitor extends CommonVisitor<PairAllTypeClass> {
    visitIdCreatedNamePair(ctx: IdCreatedNamePairContext) {
        return IdCreatedNamePairTypeClass.create(ctx);
    }

    visitElementValuePair(ctx: ElementValuePairContext) {
        return ElementValuePairTypeClass.create(ctx);
    }

    visitMapCreatorRestPair(ctx: MapCreatorRestPairContext) {
        return MapCreatorRestPairTypeClass.create(ctx);
    }

    visitElementValuePairs(ctx: ElementValuePairsContext) {
        return ElementValuePairsTypeClass.create(ctx);
    }
}
