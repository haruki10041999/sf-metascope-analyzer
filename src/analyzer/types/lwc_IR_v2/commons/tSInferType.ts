import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSInferType, type TSInferType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSTypeParameterTypeClass } from '../typeScriptVisitor/tSTypeParameter';

export type TSInferTypeFields = TypeField<'tSInferType'> & {
    typeParameter: TSTypeParameterTypeClass;
};

export class TSInferTypeTypeClass extends LwcCommonTypeClass<'tSInferType', TSInferTypeFields> {
    private constructor(value: FieldsOf<TSInferTypeFields>, sourceSpan: SourceSpan) {
        super('tSInferType', value, sourceSpan);
    }

    static create(target: TSInferType, originalSource: string): TSInferTypeTypeClass {
        return new TSInferTypeTypeClass(
            {
                typeParameter: TSTypeParameterTypeClass.create(
                    target.typeParameter,
                    originalSource,
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeParameter(): TSInferTypeFields['typeParameter'] {
        return this.getFields().typeParameter;
    }
}

export const tSInferTypeTypePair: EvaluatePair<TSInferType, TSInferTypeTypeClass> =
    makeEvaluatePair(isTSInferType, (target, originalSource) =>
        TSInferTypeTypeClass.create(target, originalSource),
    );

export const isTSInferTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSInferTypeTypeClass => target instanceof TSInferTypeTypeClass;
