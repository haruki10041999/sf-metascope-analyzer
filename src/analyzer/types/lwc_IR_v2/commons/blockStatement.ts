import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBlockStatement, type BlockStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { DirectiveTypeClass } from '../standardizedVisitor/directive';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type BlockStatementFields = TypeField<'blockStatement'> & {
    directives: DirectiveTypeClass[];
    body: StatementTypeClass[];
};

export class BlockStatementTypeClass extends LwcCommonTypeClass<
    'blockStatement',
    BlockStatementFields
> {
    private constructor(value: FieldsOf<BlockStatementFields>, sourceSpan: SourceSpan) {
        super('blockStatement', value, sourceSpan);
    }

    static create(target: BlockStatement, originalSource: string): BlockStatementTypeClass {
        return new BlockStatementTypeClass(
            {
                directives: target.directives.map((child) =>
                    DirectiveTypeClass.create(child, originalSource),
                ),
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

    getDirectives(): BlockStatementFields['directives'] {
        return this.getFields().directives;
    }

    getBody(): BlockStatementFields['body'] {
        return this.getFields().body;
    }
}

export const blockStatementTypePair: EvaluatePair<BlockStatement, BlockStatementTypeClass> =
    makeEvaluatePair(isBlockStatement, (target, originalSource) =>
        BlockStatementTypeClass.create(target, originalSource),
    );

export const isBlockStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BlockStatementTypeClass => target instanceof BlockStatementTypeClass;
