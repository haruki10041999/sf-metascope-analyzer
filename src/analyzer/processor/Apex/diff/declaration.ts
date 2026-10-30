import { FileStructureType, RefPointedStructureArray } from '../../../parser';
import { UnitDiff } from './unit';

type DeclarationUnit = Extract<FileStructureType, { dataType: 'class' | 'trigger' | 'anonymous' }>;

type UnchangedDeclarationUnitDiff = Extract<UnitDiff, { status: 'unchanged' }> & {
    before: DeclarationUnit;
    after: DeclarationUnit;
};

const hasDeclaration = (unit: FileStructureType): unit is DeclarationUnit =>
    unit.dataType === 'class' || unit.dataType === 'trigger' || unit.dataType === 'anonymous';

export type DeclarationDiff =
    | {
          status: 'added' | 'removed';
          filePath: FileStructureType['filePath'];
          target: Extract<
              FileStructureType,
              { dataType: 'class' | 'trigger' | 'interface' }
          >['result']['declaration'][number] & {
              semantic: Extract<
                  FileStructureType,
                  { dataType: 'class' | 'trigger' | 'interface' }
              >['result']['semantic'];
          };
          semantic: Extract<
              FileStructureType,
              { dataType: 'class' | 'trigger' | 'interface' }
          >['result']['semantic'];
      }
    | {
          status: 'changed' | 'unchanged';
          filePath: FileStructureType['filePath'];
          before: Extract<
              FileStructureType,
              { dataType: 'class' | 'trigger' | 'interface' }
          >['result']['declaration'][number] & {
              semantic: Extract<
                  FileStructureType,
                  { dataType: 'class' | 'trigger' | 'interface' }
              >['result']['semantic'];
          };
          after: Extract<
              FileStructureType,
              { dataType: 'class' | 'trigger' | 'interface' }
          >['result']['declaration'][number] & {
              semantic: Extract<
                  FileStructureType,
                  { dataType: 'class' | 'trigger' | 'interface' }
              >['result']['semantic'];
          };
      };

const makePathMap = (
    target: Extract<
        FileStructureType,
        { dataType: 'class' | 'trigger' | 'interface' }
    >['result']['declaration'],
): Map<
    Extract<
        FileStructureType,
        { dataType: 'class' | 'trigger' | 'interface' }
    >['result']['declaration'][number]['path'],
    Extract<
        FileStructureType,
        { dataType: 'class' | 'trigger' | 'interface' }
    >['result']['declaration'][number]['result'][]
> => {
    const map = new Map<
        Extract<
            FileStructureType,
            { dataType: 'class' | 'trigger' | 'interface' }
        >['result']['declaration'][number]['path'],
        Extract<
            FileStructureType,
            { dataType: 'class' | 'trigger' | 'interface' }
        >['result']['declaration'][number]['result'][]
    >();
    target.forEach((t) => {
        if (!map.has(t.path)) {
            map.set(t.path, []);
        }
        map.get(t.path)!.push(t.result);
    });
    return map;
};

export const createDeclarationDiff = (unitDiff: UnitDiff[]): DeclarationDiff[] => {
    const declarationDiffs: DeclarationDiff[] = [];

    const filteringUnitDiffs = unitDiff.filter(
        (diff): diff is UnchangedDeclarationUnitDiff =>
            diff.status === 'unchanged' &&
            hasDeclaration(diff.before) &&
            hasDeclaration(diff.after),
    );

    filteringUnitDiffs.forEach((diff) => {
        const beforeDeclarations = diff.before.result.declaration;
        const beforeSemantics = diff.before.result.semantic;
        const afterDeclarations = diff.after.result.declaration;
        const afterSemantics = diff.after.result.semantic;
    });

    return declarationDiffs;
};
