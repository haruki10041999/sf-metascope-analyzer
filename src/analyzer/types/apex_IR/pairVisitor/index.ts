import {
    ApexParserBaseVisitor,
    ElementValuePairContext,
    IdCreatedNamePairContext,
    MapCreatorRestPairContext,
    ElementValuePairsContext,
} from '@apexdevtools/apex-parser';

import { ElementValuePairType, makeElementValuePairType } from './elementValuePair';
import { IdCreatedNamePairType, makeIdCreatedNamePairType } from './idCreatedNamePair';
import { MapCreatorPairTypeClass } from './mapCreatorPair';
import { ElementValuePairsType, makeElementValuePairsType } from './elementValuePairs';

import { ErrorTypeClass, ContextTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isMapCreatorPairType, MapCreatorPairTypeClass } from './mapCreatorPair';

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
        console.log('解析を開始します。' + 'IdCreatedNamePairContext:  ' + ctx.getText());
        const result = makeIdCreatedNamePairType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IdCreatedNamePairContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitElementValuePair(ctx: ElementValuePairContext) {
        console.log('解析を開始します。' + 'ElementValuePairContext:  ' + ctx.getText());
        const result = makeElementValuePairType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElementValuePairContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitMapCreatorRestPair(ctx: MapCreatorRestPairContext) {
        return MapCreatorPairTypeClass.create(ctx);
    }

    visitElementValuePairs(ctx: ElementValuePairsContext) {
        console.log('解析を開始します。' + 'ElementValuePairsContext:  ' + ctx.getText());
        const result = makeElementValuePairsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElementValuePairsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
