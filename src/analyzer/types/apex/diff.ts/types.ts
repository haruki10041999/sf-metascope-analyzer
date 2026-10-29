import { JsonType, StructureJson } from '../commons';
type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

type addStatus = {
    status: 'added';
    content: JsonType<string> | StructureJson;
};
