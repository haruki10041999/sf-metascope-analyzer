import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isStaticBlock, type StaticBlock } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type StaticBlockFields = TypeField<'staticBlock'> & {
    body: StatementTypeClass[];
};

export class StaticBlockTypeClass extends LwcCommonTypeClass<'staticBlock', StaticBlockFields> {
    private constructor(value: FieldsOf<StaticBlockFields>, sourceSpan: SourceSpan) {
        super('staticBlock', value, sourceSpan);
    }

    static create(target: StaticBlock, originalSource: string): StaticBlockTypeClass {
        return new StaticBlockTypeClass(
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

    getBody(): StaticBlockFields['body'] {
        return this.getFields().body;
    }
}

export const staticBlockTypePair: EvaluatePair<StaticBlock, StaticBlockTypeClass> =
    makeEvaluatePair(isStaticBlock, (target, originalSource) =>
        StaticBlockTypeClass.create(target, originalSource),
    );

export const isStaticBlockType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is StaticBlockTypeClass => target instanceof StaticBlockTypeClass;
