import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSModuleBlock, type TSModuleBlock } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type TSModuleBlockFields = TypeField<'tSModuleBlock'> & {
    body: StatementTypeClass[];
};

export class TSModuleBlockTypeClass extends LwcCommonTypeClass<
    'tSModuleBlock',
    TSModuleBlockFields
> {
    private constructor(value: FieldsOf<TSModuleBlockFields>, sourceSpan: SourceSpan) {
        super('tSModuleBlock', value, sourceSpan);
    }

    static create(target: TSModuleBlock, originalSource: string): TSModuleBlockTypeClass {
        return new TSModuleBlockTypeClass(
            {
                body: visitNodeList(
                    target.body,
                    originalSource,
                    statementVisitorEvaluatePairs(),
                    'StatementVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getBody(): TSModuleBlockFields['body'] {
        return this.getFields().body;
    }
}

export const tSModuleBlockTypePair: EvaluatePair<TSModuleBlock, TSModuleBlockTypeClass> =
    makeEvaluatePair(isTSModuleBlock, (target, originalSource) =>
        TSModuleBlockTypeClass.create(target, originalSource),
    );

export const isTSModuleBlockType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSModuleBlockTypeClass => target instanceof TSModuleBlockTypeClass;
