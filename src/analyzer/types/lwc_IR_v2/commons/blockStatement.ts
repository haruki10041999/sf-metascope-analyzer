import { isBlockStatement, type BlockStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { directiveTypePair, type DirectiveTypeClass } from '../standardizedVisitor/directive';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

const blockStatementDirectivesPairs = lazyPairs(() => [directiveTypePair] as const);

export type BlockStatementFields = {
    directives: (DirectiveTypeClass | LwcErrorTypeClass)[];
    body: (StatementTypeClass | LwcErrorTypeClass)[];
};

export class BlockStatementTypeClass extends LwcCommonTypeClass<'blockStatement'> {
    private readonly value: BlockStatementFields;

    private constructor(value: BlockStatementFields) {
        super('blockStatement');
        this.value = value;
    }

    static create(target: BlockStatement, originalSource: string): BlockStatementTypeClass {
        return new BlockStatementTypeClass({
            directives: visitNodeList(
                target.directives,
                originalSource,
                blockStatementDirectivesPairs(),
                'BlockStatement.directives',
            ),
            body: visitNodeList(
                target.body,
                originalSource,
                statementVisitorEvaluatePairs(),
                'StatementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BlockStatementFields {
        return this.value;
    }

    getDirectives(): BlockStatementFields['directives'] {
        return this.value.directives;
    }

    getBody(): BlockStatementFields['body'] {
        return this.value.body;
    }
}

export const blockStatementTypePair: EvaluatePair<BlockStatement, BlockStatementTypeClass> =
    makeEvaluatePair(isBlockStatement, (target, originalSource) =>
        BlockStatementTypeClass.create(target, originalSource),
    );

export const isBlockStatementType = (
    target: LwcCommonTypeClass<string>,
): target is BlockStatementTypeClass => target instanceof BlockStatementTypeClass;
