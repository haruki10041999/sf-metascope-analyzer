import { SelectList, SelectEntry } from '../converter';

type FieldName = string[];
type SoqlFunction = {
    name: string;
    arguments?: FieldName;
};
