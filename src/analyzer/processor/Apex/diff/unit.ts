import { ErrorFileStructureType, FileStructureType } from '../../../parser';
import { CompilationUnitJson } from '../../../types';

import {
    TypeDeclarationDiff,
    UnitContentDiff,
    makeTypeDeclarationDiff,
    hasChange,
    makeUnitContentDiff,
} from './unitBody';

export type UnitDiffAttribute<T> = {
    before: T;
    after: T;
};

export type UnitDiffAttributeArray<T> = {
    common: T[];
    before: T[];
    after: T[];
};

export type UnitDiff =
    | {
          status: 'added' | 'removed';
          filePath: (FileStructureType | ErrorFileStructureType)['filePath'];
          dataType: (FileStructureType | ErrorFileStructureType)['dataType'];
          resolvedError: (FileStructureType | ErrorFileStructureType)['resolvedError'];
          target: (FileStructureType | ErrorFileStructureType)['result'];
      }
    | {
          status: 'unchanged';
          filePath: (FileStructureType | ErrorFileStructureType)['filePath'];
          dataType: (FileStructureType | ErrorFileStructureType)['dataType'];
          resolvedError: (FileStructureType | ErrorFileStructureType)['resolvedError'];
          target: UnitDiffAttribute<(FileStructureType | ErrorFileStructureType)['result']>;
          // ファイルの中身の差分 (dataType が同じで、どちらもエラーでないとき)
          content?: UnitContentDiff;
      }
    | {
          status: 'changed';
          filePath: (FileStructureType | ErrorFileStructureType)['filePath'];
          dataType:
              | (FileStructureType | ErrorFileStructureType)['dataType']
              | UnitDiffAttribute<(FileStructureType | ErrorFileStructureType)['dataType']>;
          resolvedError:
              | (FileStructureType | ErrorFileStructureType)['resolvedError']
              | UnitDiffAttributeArray<
                    (FileStructureType | ErrorFileStructureType)['resolvedError'][number]
                >;
          target: UnitDiffAttribute<(FileStructureType | ErrorFileStructureType)['result']>;
          content?: UnitContentDiff;
      };

export type ClsFileDiff = (
    | {
          status: 'unchanged';
          kind: FileStructureType<CompilationUnitJson>['result']['base']['kind'];
          target: UnitDiffAttribute<FileStructureType<CompilationUnitJson>['result']>;
      }
    | {
          status: 'changed';
          kind: UnitDiffAttribute<FileStructureType<CompilationUnitJson>['result']['base']['kind']>;
          target: UnitDiffAttribute<FileStructureType<CompilationUnitJson>['result']>;
      }
) & {
    // 型宣言 (class / interface / enum) の中身の差分
    content: TypeDeclarationDiff;
};

const makeResolvedErrorDiff = (
    before: (FileStructureType | ErrorFileStructureType)['resolvedError'],
    after: (FileStructureType | ErrorFileStructureType)['resolvedError'],
): UnitDiffAttributeArray<
    (FileStructureType | ErrorFileStructureType)['resolvedError'][number]
> => {
    const common: (FileStructureType | ErrorFileStructureType)['resolvedError'] = [];
    const _before: (FileStructureType | ErrorFileStructureType)['resolvedError'] = [];
    const _after: (FileStructureType | ErrorFileStructureType)['resolvedError'] = [...after];

    before.forEach((b) => {
        const objectKey = b.sourceKeys.objectKey;
        const index = _after.findIndex((a) => a.sourceKeys.objectKey === objectKey);

        if (index === -1) {
            _before.push(b);
        } else {
            common.push(b);
            _after.splice(index, 1);
        }
    });

    return {
        common: common,
        before: _before,
        after: _after,
    };
};

export const makeUnitDiffs = (
    before: (FileStructureType | ErrorFileStructureType)[],
    after: (FileStructureType | ErrorFileStructureType)[],
): UnitDiff[] => {
    const unitDiff: UnitDiff[] = [];

    const _after = [...after];

    before.forEach((b) => {
        const { dataType, filePath, resolvedError, result } = b;
        const filePathIndex = _after.findIndex((a) => a.filePath === filePath);

        if (filePathIndex === -1) {
            unitDiff.push({
                status: 'removed',
                filePath: filePath,
                dataType: dataType,
                resolvedError: resolvedError,
                target: result,
            });
        } else {
            const {
                dataType: afterDataType,
                filePath: _,
                resolvedError: afterResolvedError,
                result: afterResult,
            } = _after.at(filePathIndex)!;

            const target: UnitDiffAttribute<
                (FileStructureType | ErrorFileStructureType)['result']
            > = {
                before: result,
                after: afterResult,
            };

            const isSameDataType = dataType === afterDataType;
            const resolvedErrorDiff = makeResolvedErrorDiff(resolvedError, afterResolvedError);
            const content =
                isSameDataType && dataType !== 'error'
                    ? makeUnitContentDiff(dataType, result, afterResult)
                    : undefined;

            if (
                isSameDataType &&
                resolvedErrorDiff.before.length === 0 &&
                resolvedErrorDiff.after.length === 0 &&
                !hasChange(content)
            ) {
                unitDiff.push({
                    status: 'unchanged',
                    filePath: filePath,
                    dataType: dataType,
                    resolvedError: resolvedErrorDiff.common,
                    target: target,
                    ...(content ? { content } : {}),
                });
            } else {
                unitDiff.push({
                    status: 'changed',
                    filePath: filePath,
                    dataType: isSameDataType
                        ? b.dataType
                        : { before: dataType, after: afterDataType },
                    resolvedError:
                        resolvedErrorDiff.before.length === 0 &&
                        resolvedErrorDiff.after.length === 0
                            ? resolvedErrorDiff.common
                            : resolvedErrorDiff,
                    target: target,
                    ...(content ? { content } : {}),
                });
            }

            _after.splice(filePathIndex, 1);
        }
    });

    _after.forEach((a) => {
        const { dataType, filePath, resolvedError, result } = a;
        unitDiff.push({
            status: 'added',
            filePath: filePath,
            dataType: dataType,
            resolvedError: resolvedError,
            target: result,
        });
    });

    return unitDiff;
};

export const makeClsFileDiff = (
    target: UnitDiffAttribute<FileStructureType<CompilationUnitJson>['result']>[],
): ClsFileDiff[] => {
    const clsFileDiff: ClsFileDiff[] = [];

    target.forEach((t) => {
        const content = makeTypeDeclarationDiff(t.before.base, t.after.base, {
            before: t.before.sourceObject,
            after: t.after.sourceObject,
        });

        if (t.before.base.kind === t.after.base.kind) {
            clsFileDiff.push({
                status: 'unchanged',
                kind: t.before.base.kind,
                target: t,
                content,
            });
        } else {
            clsFileDiff.push({
                status: 'changed',
                kind: { before: t.before.base.kind, after: t.after.base.kind },
                target: t,
                content,
            });
        }
    });

    return clsFileDiff;
};
