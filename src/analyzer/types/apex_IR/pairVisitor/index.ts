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

import { ErrorTypeClass, ContextTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isElementValuePairType, ElementValuePairTypeClass } from './elementValuePair';
export { isIdCreatedNamePairType, IdCreatedNamePairTypeClass } from './idCreatedNamePair';
export { isMapCreatorRestPairType, MapCreatorRestPairTypeClass } from './mapCreatorRestPair';
export { isElementValuePairsType, ElementValuePairsTypeClass } from './elementValuePairs';
export class PairTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export class DoublePairTypeClass<Tleft, Tright> extends PairTypeClass<{
    left: Tleft | null;
    right: Tright | null;
}> {
    private left: Tleft | null = null;
    private right: Tright | null = null;

    constructor(
        type: string,
        left: Tleft | null,
        right: Tright | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, { left: left, right: right }, errorClasses);
        this.left = left;
        this.right = right;
    }

    getLeft(): Tleft | null {
        return this.left;
    }

    getRight(): Tright | null {
        return this.right;
    }

    isLeftNull(): boolean {
        return this.left === null;
    }

    isRightNull(): boolean {
        return this.right === null;
    }
}

export const isPairTypeAll = (target: CommonTypeClass): target is PairTypeClass<unknown> => {
    return target instanceof PairTypeClass;
};

export class PairVisitor extends CommonVisitor<PairTypeClass<unknown>> {
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
