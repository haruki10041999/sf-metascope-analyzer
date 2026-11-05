import { isTSConditionalType, type TSConditionalType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSConditionalTypeFields = {
    checkType: TSTypeTypeClass | LwcErrorTypeClass;
    extendsType: TSTypeTypeClass | LwcErrorTypeClass;
    trueType: TSTypeTypeClass | LwcErrorTypeClass;
    falseType: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSConditionalTypeTypeClass extends LwcCommonTypeClass<'tSConditionalType'> {
    private readonly value: TSConditionalTypeFields;

    private constructor(value: TSConditionalTypeFields) {
        super('tSConditionalType');
        this.value = value;
    }

    static create(target: TSConditionalType, originalSource: string): TSConditionalTypeTypeClass {
        return new TSConditionalTypeTypeClass({
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSConditionalTypeFields {
        return this.value;
    }

    getCheckType(): TSConditionalTypeFields['checkType'] {
        return this.value.checkType;
    }

    getExtendsType(): TSConditionalTypeFields['extendsType'] {
        return this.value.extendsType;
    }

    getTrueType(): TSConditionalTypeFields['trueType'] {
        return this.value.trueType;
    }

    getFalseType(): TSConditionalTypeFields['falseType'] {
        return this.value.falseType;
    }
}

export const tSConditionalTypeTypePair: EvaluatePair<
    TSConditionalType,
    TSConditionalTypeTypeClass
> = makeEvaluatePair(isTSConditionalType, (target, originalSource) =>
    TSConditionalTypeTypeClass.create(target, originalSource),
);

export const isTSConditionalTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSConditionalTypeTypeClass => target instanceof TSConditionalTypeTypeClass;
