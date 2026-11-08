import { isTSInferType, type TSInferType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import {
    tSTypeParameterTypePair,
    type TSTypeParameterTypeClass,
} from '../typeScriptVisitor/tSTypeParameter';

const tSInferTypeTypeParameterPairs = lazyPairs(() => [tSTypeParameterTypePair] as const);

export type TSInferTypeFields = {
    typeParameter: TSTypeParameterTypeClass | LwcErrorTypeClass;
};

export class TSInferTypeTypeClass extends LwcCommonTypeClass<'tSInferType'> {
    private readonly value: TSInferTypeFields;

    private constructor(value: TSInferTypeFields) {
        super('tSInferType');
        this.value = value;
    }

    static create(target: TSInferType, originalSource: string): TSInferTypeTypeClass {
        return new TSInferTypeTypeClass({
            typeParameter: visitNode(
                target.typeParameter,
                originalSource,
                tSInferTypeTypeParameterPairs(),
                'TSInferType.typeParameter',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSInferTypeFields {
        return this.value;
    }

    getTypeParameter(): TSInferTypeFields['typeParameter'] {
        return this.value.typeParameter;
    }
}

export const tSInferTypeTypePair: EvaluatePair<TSInferType, TSInferTypeTypeClass> =
    makeEvaluatePair(isTSInferType, (target, originalSource) =>
        TSInferTypeTypeClass.create(target, originalSource),
    );

export const isTSInferTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSInferTypeTypeClass => target instanceof TSInferTypeTypeClass;
