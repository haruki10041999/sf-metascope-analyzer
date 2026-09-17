import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

import {
    Dependency,
    DependencyDiff
} from '../types/metadataDependency';

import { CommonType, 
    MetadataObjectDiff,
    MetadataFieldDiff, 
} from '../types/metadata';


export class MetadataDependencyProcessor {
    private dependencyDiffs:DependencyDiff[] = [];

    constructor(metadataObjectDiffs:MetadataObjectDiff[]) {
        this.reset(metadataObjectDiffs);
    }

    getAllDependencyDiff():DependencyDiff[] {
        return this.dependencyDiffs;
    }

    getDependencyDiff(targetObjectApiName,depth=1):DependencyDiff[] {
        
    }

    
    getAllDependency():Dependency[] {
        return this.convertDependency(this.dependencyDiffs);
    }

    getDependency(targetObjectApiName,depth = 1):Dependency[] {

    }

    convertDependency(dependencyDiff:DependencyDiff[]):Dependency[] {
        return dependencyDiff.map(({status,...dependency}) => dependency);
    }

    reset(metadataObjectDiffs:MetadataObjectDiff[]):void {
        this.dependencyDiffs = this.calculateDependency(metadataObjectDiffs);
    }

    private calculateDependency(metadataObjectDiffs:MetadataObjectDiff[]):DependencyDiff[] {
        const dependencyDiffs:DependencyDiff[] = [];

        const processedMetadataDiffs:MetadataObjectDiff[] = metadataObjectDiffs.map((object) => {
            return {
                ...object,
                fields:object.fields.filter((field) => field.referenceObjectApiName)
            }
        })

        processedMetadataDiffs.forEach((metadataDiff) => {
            const parentObjectApiName = metadataDiff.apiName;
            metadataDiff.fields.forEach((fieldDiff) => {
                const parentFieldApiName = fieldDiff.apiName;
                const chidObjectApiName = fieldDiff.referenceObjectApiName!;
                const status = fieldDiff.status;
                dependencyDiffs.push({
                    parentObjectApiName:parentObjectApiName,
                    parentFieldApiName:parentFieldApiName,
                    childObjectApiName:chidObjectApiName,
                    status:status
                })
            })
        })

        return dependencyDiffs;
    }
}