import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeLiteral, type TSTypeLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSTypeElementVisitorEvaluatePairs,
    type TSTypeElementTypeClass,
} from '../tsTypeElementVisitor';

export type TSTypeLiteralFields = TypeField<'tSTypeLiteral'> & {
    members: TSTypeElementTypeClass[];
};

export class TSTypeLiteralTypeClass extends LwcCommonTypeClass<
    'tSTypeLiteral',
    TSTypeLiteralFields
> {
    private constructor(value: FieldsOf<TSTypeLiteralFields>, sourceSpan: SourceSpan) {
        super('tSTypeLiteral', value, sourceSpan);
    }

    static create(target: TSTypeLiteral, originalSource: string): TSTypeLiteralTypeClass {
        return new TSTypeLiteralTypeClass(
            {
                members: visitNodeList(
                    target.members,
                    originalSource,
                    tSTypeElementVisitorEvaluatePairs(),
                    'TSTypeElementVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getMembers(): TSTypeLiteralFields['members'] {
        return this.getFields().members;
    }
}

export const tSTypeLiteralTypePair: EvaluatePair<TSTypeLiteral, TSTypeLiteralTypeClass> =
    makeEvaluatePair(isTSTypeLiteral, (target, originalSource) =>
        TSTypeLiteralTypeClass.create(target, originalSource),
    );

export const isTSTypeLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeLiteralTypeClass => target instanceof TSTypeLiteralTypeClass;
