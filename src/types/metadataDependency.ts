import { Status } from './commons';

export type Dependency = {
    parentObjectApiName:string;
    parentFieldApiName:string;
    childObjectApiName:string;
}

export type DependencyDiff = Dependency & {
    status:Status
}