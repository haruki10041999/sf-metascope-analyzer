import { isTSTypeLiteral, type TSTypeLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    tSTypeElementVisitorEvaluatePairs,
    type TSTypeElementTypeClass,
} from '../tsTypeElementVisitor';

export type TSTypeLiteralFields = {
    members: (TSTypeElementTypeClass | LwcErrorTypeClass)[];
};

export class TSTypeLiteralTypeClass extends LwcCommonTypeClass<'tSTypeLiteral'> {
    private readonly value: TSTypeLiteralFields;

    private constructor(value: TSTypeLiteralFields) {
        super('tSTypeLiteral');
        this.value = value;
    }

    static create(target: TSTypeLiteral, originalSource: string): TSTypeLiteralTypeClass {
        return new TSTypeLiteralTypeClass({
            members: visitNodeList(
                target.members,
                originalSource,
                tSTypeElementVisitorEvaluatePairs(),
                'TSTypeElementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeLiteralFields {
        return this.value;
    }

    getMembers(): TSTypeLiteralFields['members'] {
        return this.value.members;
    }
}

export const tSTypeLiteralTypePair: EvaluatePair<TSTypeLiteral, TSTypeLiteralTypeClass> =
    makeEvaluatePair(isTSTypeLiteral, (target, originalSource) =>
        TSTypeLiteralTypeClass.create(target, originalSource),
    );

export const isTSTypeLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeLiteralTypeClass => target instanceof TSTypeLiteralTypeClass;
