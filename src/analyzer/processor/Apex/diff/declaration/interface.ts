import { FileStructureType } from '../../../../parser';
import {
    CompilationUnitJson,
    ConvertKeys,
    ErrorJson,
    InterfaceDeclarationJson,
    InterfaceMethodJson,
    SourceJson,
} from '../../../../types';

import { ClsFileDiff } from '../unit';

type InterfaceDiff = {
    stats: 'unchanged';
    objectKey: string;
    data: Omit<InterfaceDeclarationJson, 'sourcekeys'>;
    before: Omit<ConvertKeys, 'objectKey'>;
    after: Omit<ConvertKeys, 'objectKey'>;
};

export const makeInterfaceDiff = (
    before: InterfaceDeclarationJson,
    after: InterfaceDeclarationJson,
) => {};

export type InterfaceMethodDiff = {
    status: 'unchanged';
};

export const makeInterfaceMethodDiff = (
    before: (InterfaceMethodJson | ErrorJson)[],
    after: (InterfaceMethodJson | ErrorJson)[],
) => {};
