import { isTSModuleBlock, type TSModuleBlock } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type TSModuleBlockFields = {
    body: (StatementTypeClass | LwcErrorTypeClass)[];
};

export class TSModuleBlockTypeClass extends LwcCommonTypeClass<'tSModuleBlock'> {
    private readonly value: TSModuleBlockFields;

    private constructor(value: TSModuleBlockFields) {
        super('tSModuleBlock');
        this.value = value;
    }

    static create(target: TSModuleBlock, originalSource: string): TSModuleBlockTypeClass {
        return new TSModuleBlockTypeClass({
            body: visitNodeList(
                target.body,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSModuleBlockFields {
        return this.value;
    }

    getBody(): TSModuleBlockFields['body'] {
        return this.value.body;
    }
}

export const tSModuleBlockTypePair: EvaluatePair<TSModuleBlock, TSModuleBlockTypeClass> =
    makeEvaluatePair(isTSModuleBlock, (target, originalSource) =>
        TSModuleBlockTypeClass.create(target, originalSource),
    );

export const isTSModuleBlockType = (
    target: LwcCommonTypeClass<string>,
): target is TSModuleBlockTypeClass => target instanceof TSModuleBlockTypeClass;
