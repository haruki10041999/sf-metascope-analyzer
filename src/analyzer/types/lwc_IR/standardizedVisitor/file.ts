import { isFile, type File } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { programTypePair, type ProgramTypeClass } from '../commons/program';

const fileProgramPairs = lazyPairs(() => [programTypePair] as const);

export type FileFields = {
    program: ProgramTypeClass | LwcErrorTypeClass;
};

export class FileTypeClass extends LwcCommonTypeClass<'file'> {
    private readonly value: FileFields;

    private constructor(value: FileFields) {
        super('file');
        this.value = value;
    }

    static create(target: File, originalSource: string): FileTypeClass {
        return new FileTypeClass({
            program: visitNode(target.program, originalSource, fileProgramPairs(), 'File.program'),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): FileFields {
        return this.value;
    }

    getProgram(): FileFields['program'] {
        return this.value.program;
    }
}

export const fileTypePair: EvaluatePair<File, FileTypeClass> = makeEvaluatePair(
    isFile,
    (target, originalSource) => FileTypeClass.create(target, originalSource),
);

export const isFileType = (target: LwcCommonTypeClass<string>): target is FileTypeClass =>
    target instanceof FileTypeClass;
