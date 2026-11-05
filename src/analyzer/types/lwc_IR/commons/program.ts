import { isProgram, type Program } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { directiveTypePair, type DirectiveTypeClass } from '../standardizedVisitor/directive';
import {
    interpreterDirectiveTypePair,
    type InterpreterDirectiveTypeClass,
} from '../standardizedVisitor/interpreterDirective';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

const programInterpreterPairs = lazyPairs(() => [interpreterDirectiveTypePair] as const);
const programDirectivesPairs = lazyPairs(() => [directiveTypePair] as const);

export type ProgramFields = {
    sourceType: Program['sourceType'];
    interpreter: InterpreterDirectiveTypeClass | LwcErrorTypeClass | null;
    directives: (DirectiveTypeClass | LwcErrorTypeClass)[];
    body: (StatementTypeClass | LwcErrorTypeClass)[];
};

export class ProgramTypeClass extends LwcCommonTypeClass<'program'> {
    private readonly value: ProgramFields;

    private constructor(value: ProgramFields) {
        super('program');
        this.value = value;
    }

    static create(target: Program, originalSource: string): ProgramTypeClass {
        return new ProgramTypeClass({
            sourceType: target.sourceType,
            interpreter: visitOptionalNode(
                target.interpreter,
                originalSource,
                programInterpreterPairs(),
                'Program.interpreter',
            ),
            directives: visitNodeList(
                target.directives,
                originalSource,
                programDirectivesPairs(),
                'Program.directives',
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
    override getFields(): ProgramFields {
        return this.value;
    }

    getSourceType(): ProgramFields['sourceType'] {
        return this.value.sourceType;
    }

    getInterpreter(): ProgramFields['interpreter'] {
        return this.value.interpreter;
    }

    getDirectives(): ProgramFields['directives'] {
        return this.value.directives;
    }

    getBody(): ProgramFields['body'] {
        return this.value.body;
    }
}

export const programTypePair: EvaluatePair<Program, ProgramTypeClass> = makeEvaluatePair(
    isProgram,
    (target, originalSource) => ProgramTypeClass.create(target, originalSource),
);

export const isProgramType = (target: LwcCommonTypeClass<string>): target is ProgramTypeClass =>
    target instanceof ProgramTypeClass;
