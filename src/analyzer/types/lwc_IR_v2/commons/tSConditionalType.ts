import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSConditionalType, type TSConditionalType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSConditionalTypeFields = TypeField<'tSConditionalType'> & {
    checkType: TSTypeTypeClass;
    extendsType: TSTypeTypeClass;
    trueType: TSTypeTypeClass;
    falseType: TSTypeTypeClass;
};

export class TSConditionalTypeTypeClass extends LwcCommonTypeClass<
    'tSConditionalType',
    TSConditionalTypeFields
> {
    private constructor(value: FieldsOf<TSConditionalTypeFields>, sourceSpan: SourceSpan) {
        super('tSConditionalType', value, sourceSpan);
    }

    static create(target: TSConditionalType, originalSource: string): TSConditionalTypeTypeClass {
        return new TSConditionalTypeTypeClass(
            {
                checkType: visitNode(
                    target.checkType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                extendsType: visitNode(
                    target.extendsType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                trueType: visitNode(
                    target.trueType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                falseType: visitNode(
                    target.falseType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getCheckType(): TSConditionalTypeFields['checkType'] {
        return this.getFields().checkType;
    }

    getExtendsType(): TSConditionalTypeFields['extendsType'] {
        return this.getFields().extendsType;
    }

    getTrueType(): TSConditionalTypeFields['trueType'] {
        return this.getFields().trueType;
    }

    getFalseType(): TSConditionalTypeFields['falseType'] {
        return this.getFields().falseType;
    }
}

export const tSConditionalTypeTypePair: EvaluatePair<
    TSConditionalType,
    TSConditionalTypeTypeClass
> = makeEvaluatePair(isTSConditionalType, (target, originalSource) =>
    TSConditionalTypeTypeClass.create(target, originalSource),
);

export const isTSConditionalTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSConditionalTypeTypeClass => target instanceof TSConditionalTypeTypeClass;
