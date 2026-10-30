import { FileStructureType } from '../../../parser';

export type UnitDiff =
    | {
          status: 'added' | 'removed';
          target: FileStructureType;
      }
    // Extract や status による絞り込みが効くよう、status ごとに別のメンバーにする
    | {
          status: 'changed';
          before: FileStructureType;
          after: FileStructureType;
      }
    | {
          status: 'unchanged';
          before: FileStructureType;
          after: FileStructureType;
      };

export const makeUnitDiffs = (
    before: FileStructureType[],
    after: FileStructureType[],
): UnitDiff[] => {
    const unitDiffs: UnitDiff[] = [];

    const _after = [...after];

    before.forEach((beforeUnit) => {
        const sameAfterUnitIndex = _after.findIndex(
            (afterUnit) => afterUnit.filePath === beforeUnit.filePath,
        );
        if (sameAfterUnitIndex !== -1) {
            if (beforeUnit.dataType === _after[sameAfterUnitIndex]!.dataType) {
                unitDiffs.push({
                    status: 'unchanged',
                    before: beforeUnit,
                    after: _after[sameAfterUnitIndex]!,
                });
            } else {
                unitDiffs.push({
                    status: 'changed',
                    before: beforeUnit,
                    after: _after[sameAfterUnitIndex]!,
                });
            }
            _after.splice(sameAfterUnitIndex, 1);
        } else {
            unitDiffs.push({
                status: 'removed',
                target: beforeUnit,
            });
        }
    });
    _after.forEach((afterUnit) => {
        unitDiffs.push({
            status: 'added',
            target: afterUnit,
        });
    });

    return unitDiffs;
};
