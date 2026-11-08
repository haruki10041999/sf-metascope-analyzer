import { createHash } from 'node:crypto';

const HASH_LENGTH = 16;
const hash = (value: unknown): string => {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, HASH_LENGTH);
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map((v) => sortKeys(v));
    }
    if (!isRecord(value)) {
        return value;
    }
    return Object.fromEntries(
        Object.keys(value)
            .sort()
            .map((key) => [key, sortKeys(value[key])]),
    );
};

export type SourceKeys = {
    objectKey: string;
    sourceKey: string;
};

export type TypeField<TName extends string> = {
    type: TName;
};

export const isSpicifyTypeField = <TName extends string>(
    type: TName,
    target: unknown,
): target is TypeField<TName> => {
    return (
        target !== null && typeof target === 'object' && 'type' in target && target.type === type
    );
};

export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export type SourceObject = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceSpan, 'context'>)[];
};

export class SourceObjectRegistory {
    private sourceObjects: SourceObject[] = [];

    register(sourceObjects: SourceObject[]): void {
        sourceObjects.forEach((s) => {
            const target = this.sourceObjects.find((b) => b.objectKey === s.objectKey);

            if (target) {
                target.source.push(...s.source);
            } else {
                this.sourceObjects.push(s);
            }
        });
    }

    getSourceObject(): SourceObject[] {
        return this.sourceObjects;
    }
}

/** 文字位置 → SourcePosition (行・列) の変換を作る。改行は LF にそろえておく */
export const makePositionOf = (source: string) => {
    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '\n') lineStarts.push(i + 1);
    }
    return (offset: number): SourcePosition => {
        let low = 0;
        let high = lineStarts.length - 1;
        while (low < high) {
            const middle = (low + high + 1) >> 1;
            if (lineStarts[middle]! <= offset) low = middle;
            else high = middle - 1;
        }
        return { offset, line: low + 1, column: offset - lineStarts[low]! };
    };
};

export abstract class CommonTypeClass<TName extends string, TField extends TypeField<TName>> {
    private sourceKeys: SourceKeys;
    private field: Readonly<TField>;
    private sourceSpan: SourceSpan;
    private sourceObjectRegistory: SourceObjectRegistory = new SourceObjectRegistory();

    constructor(
        type: TName,
        properties: Omit<TField, 'type'> = {} as Omit<TField, 'type'>,
        sourceSpan: SourceSpan,
    ) {
        this.field = {
            type,
            ...properties,
        } as TField;

        this.sourceSpan = sourceSpan;
        const { context, ...rest } = sourceSpan;

        this.sourceKeys = {
            objectKey: hash(sortKeys(this.extractField(this.field))),
            sourceKey: hash(rest),
        };

        const hasValidSourcePosition = (position: SourcePosition): boolean => {
            return Object.values(position).every((value) => value === -1);
        };

        const isSourcePositionValid =
            !hasValidSourcePosition(sourceSpan.start) && !hasValidSourcePosition(sourceSpan.end);

        const sourceObject: SourceObject[] = isSourcePositionValid
            ? [
                  {
                      objectKey: this.sourceKeys.objectKey,
                      context,
                      source: [
                          {
                              sourceKey: this.sourceKeys.sourceKey,
                              start: sourceSpan.start,
                              end: sourceSpan.end,
                          },
                      ],
                  },
              ]
            : [];

        this.sourceObjectRegistory.register([
            ...sourceObject,
            ...this.gatherSourceObject(this.field),
        ]);
    }

    getFields(): Readonly<TField> {
        return this.field;
    }

    getType(): TName {
        return this.getFields().type;
    }

    getSpan(): SourceSpan {
        return this.sourceSpan;
    }

    getSourceRegistory(): SourceObjectRegistory {
        return this.sourceObjectRegistory;
    }

    private extractField(target: unknown): unknown {
        const extract = (value: unknown): unknown => {
            if (Array.isArray(value)) {
                return value.map(extract);
            }

            if (value === null || typeof value !== 'object') {
                return value;
            }

            if (value instanceof CommonTypeClass) {
                return extract(value.getFields());
            }

            return Object.fromEntries(
                Object.entries(value).map(([key, child]) => [key, extract(child)]),
            );
        };

        return extract(target);
    }

    protected gatherSourceObject(target: unknown): SourceObject[] {
        const sourceObjects: SourceObject[] = [];

        const gather = (value: unknown): void => {
            if (Array.isArray(value)) {
                value.forEach(gather);
                return;
            }

            if (value === null || typeof value !== 'object') {
                return;
            }

            if (value instanceof CommonTypeClass) {
                sourceObjects.push(...value.getSourceRegistory().getSourceObject());
                return;
            }

            Object.values(value).forEach(gather);
        };

        gather(target);

        return sourceObjects;
    }

    protected findChildren<T extends CommonTypeClass<string, TypeField<string>>>(
        isT: (target: unknown) => target is T,
    ): T[] {
        const children: T[] = [];

        const find = (target: unknown): void => {
            if (isT(target)) {
                children.push(target);
                return;
            }

            if (Array.isArray(target)) {
                target.forEach(find);
                return;
            }

            if (target !== null && typeof target === 'object') {
                Object.values(target).forEach(find);
            }
        };

        find(this.getFields());

        return children;
    }

    abstract getChildNodes(): CommonTypeClass<string, TypeField<string>>[];
}

export type ErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

export type ErrorField = TypeField<'analyzerError'> & {
    code: ErrorCode;
    contextType: string;
    context: string;
    errorMessage: string;
};

export const isErrorField = (target: unknown): target is ErrorField => {
    return isSpicifyTypeField('analyzerError', target);
};

export interface ErrorOutputFuncsution {
    getCode: () => ErrorField['code'];
    getContextType: () => ErrorField['context'];
    getContext: () => ErrorField['contextType'];
    getParseErrorMessage: () => ErrorField['errorMessage'];
}
