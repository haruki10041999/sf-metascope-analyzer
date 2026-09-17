import fs from 'fs';
import path from 'path';

import {
    MetadataParser
} from '../parser/metadata';

import { Status } from '../types/commons';


import { 
    MetadataObject,
    MetadataField,
    MetadataObjectDiff,
    MetadataFieldDiff, 
} from '../types/metadata';

export class MetadataProcessor {
    private preDir:string = '';
    private objectDir:string = '';

    private metadataObjectDiffs:MetadataObjectDiff[] = [];


    constructor(
         preDir:string, //結果をセーブしている部分
        objectDir:string, //force-app/default/main/objects
    ) {
        this.reset(preDir,objectDir);
    }

    getMetadataObjectDiffs():MetadataObjectDiff[] {
        return this.metadataObjectDiffs;
    }

    getNewMetadataObjects():MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs.filter((object) => 
                object.status === 'New'
            ).map((object) => {
                return{
                    apiName: object.apiName,
                    dataType: object.dataType,
                    fields: object.fields.filter((field) => field.status === 'New'),
                    status:object.status
                }
            })
        )
    }

    getDeleteMetadataObjects():MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs.filter((object) => 
                object.status === 'Delete'
            ).map((object) => {
                return{
                    apiName: object.apiName,
                    dataType: object.dataType,
                    fields: object.fields.filter((field) => field.status === 'Delete'),
                    status:object.status
                }
            })
        )
    }

    getUpdatedMetadataObjects():MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs.filter((object) => 
                object.status !== 'Delete'
            ).map((object) => {
                return{
                    apiName: object.apiName,
                    dataType: object.dataType,
                    fields: object.fields.filter((field) => field.status !== 'Delete'),
                    status:object.status
                }
            })
        )
    }

    getPreMetadataObjects():MetadataObject[] {
        return this.convertMetaDataObjects(
            this.metadataObjectDiffs.filter((object) => 
                object.status !== 'New'
            ).map((object) => {
                return{
                    apiName: object.apiName,
                    dataType: object.dataType,
                    fields: object.fields.filter((field) => field.status !== 'New'),
                    status:object.status
                }
            })
        )
    }

    
    convertMetaDataObjects(metadataObjectDiffs:MetadataObjectDiff[]):MetadataObject[] {
        return metadataObjectDiffs.map((metadata) => {
             return {
                apiName: metadata.apiName,
                dataType: metadata.dataType,
                fields: metadata.fields
                .map(({ status, ...field }) => field),
            };
        })
    }


    reset(
        preDir:string,
        objectDir:string
    ) {
        this.preDir = preDir;
        this.objectDir = objectDir;
        this.metadataObjectDiffs = this.diffMetaDataObjects(
            preDir,objectDir
        );
    }

    save(): void {
        const objectDir = path.join(this.preDir, 'objects');
        if (!fs.existsSync(objectDir)) {
            fs.mkdirSync(objectDir, { recursive: true });
        }
        const metadataObjects:MetadataObject[] = this.getUpdatedMetadataObjects();
        metadataObjects.forEach((metadataObject) => {
            const objectFilePath = path.join(
                objectDir,
                `${metadataObject.apiName}.json`
            );
            fs.writeFileSync(objectFilePath, JSON.stringify(metadataObject, null, 2));
        });
        this.reset(this.preDir, this.objectDir);
    }

    private diffMetaDataObjects(
        basePreDir:string,
        baseCurrentDir:string,
      ): MetadataObjectDiff[] {
        const metadataObjectDiffs:MetadataObjectDiff[] = []
        const preMetadataObjects:MetadataObject[] = this.getPreObjectList(basePreDir);
        const currentMetadataObjects:MetadataObject[] = this.getCurrentObjectList(baseCurrentDir);

        const {newApiNames,deleteApiNames} = this.splitApiNames(
            preMetadataObjects.map((object) => object.apiName),
            currentMetadataObjects.map((object) => object.apiName)
        )

        currentMetadataObjects.forEach((metadata) => {
            if (newApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    apiName:metadata.apiName,
                    dataType:metadata.dataType,
                    fields:metadata.fields.map((field) => {
                        const metadataFieldDiff:MetadataFieldDiff = {
                            apiName:field.apiName,
                            dataType:field.dataType,
                            type:field.type,
                            status:'New'
                        }
                        if (field.referenceObjectApiName) {
                            metadataFieldDiff.referenceObjectApiName = field.referenceObjectApiName;
                        }
                        return metadataFieldDiff;
                    }),
                    status:'New'
                })
                return;
            }
    
            const preMetadataObject = preMetadataObjects.find((object) => 
                object.apiName === metadata.apiName
            );
            if (preMetadataObject) {
                const metadataFieldDiffs:MetadataFieldDiff[] = this.makeMetadataFieldDiffs(
                    preMetadataObject.fields,
                    metadata.fields,
                    deleteApiNames
                )
                metadataObjectDiffs.push({
                    apiName:metadata.apiName,
                    dataType:metadata.dataType,
                    fields:metadataFieldDiffs,
                    status:'Exist'
                })
            }
        })

        preMetadataObjects.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                metadataObjectDiffs.push({
                    apiName:metadata.apiName,
                    dataType:metadata.dataType,
                    fields:metadata.fields.map((field) => {
                        const metadataFieldDiff:MetadataFieldDiff = {
                            apiName:field.apiName,
                            dataType:field.dataType,
                            type:field.type,
                            status:'Delete'
                        }
                        if (field.referenceObjectApiName) {
                            metadataFieldDiff.referenceObjectApiName = field.referenceObjectApiName;
                        }
                        return metadataFieldDiff;
                    }),
                    status:'Delete'
                })
            }
        })

        return metadataObjectDiffs.sort((a,b) => a.apiName.localeCompare(b.apiName));
      }

      private makeMetadataFieldDiffs(
        preMetadataFields:MetadataField[],
        currentMetadataFields:MetadataField[],
        deleteObjectApiNames:string[]
      ):MetadataFieldDiff[]{
        const metadataFieldDiffs:MetadataFieldDiff[] = [];

        const {newApiNames,deleteApiNames} = this.splitApiNames(
            preMetadataFields.map((object) => object.apiName),
            currentMetadataFields.map((object) => object.apiName)
        );

        currentMetadataFields.forEach((metadata) => {
            if (metadata.referenceObjectApiName 
                && deleteObjectApiNames.includes(metadata.referenceObjectApiName)
            ) {
                metadataFieldDiffs.push({
                    apiName:metadata.apiName,
                    dataType:metadata.dataType,
                    type:metadata.type,
                    referenceObjectApiName:metadata.referenceObjectApiName,
                    status:'Delete'
                });
                return;
            }

            let status:Status = 'Exist';
            if (newApiNames.includes(metadata.apiName)) {
                status = 'New';
            }

            const metadataFieldDiff:MetadataFieldDiff = {
                apiName:metadata.apiName,
                dataType:metadata.dataType,
                type:metadata.type,
                status:status
            };
            if (metadata.referenceObjectApiName) {
                metadataFieldDiff.referenceObjectApiName = metadata.referenceObjectApiName;
            }

            metadataFieldDiffs.push(metadataFieldDiff)
        })

        preMetadataFields.forEach((metadata) => {
            if (deleteApiNames.includes(metadata.apiName)) {
                const metadataFieldDiff:MetadataFieldDiff = {
                    apiName:metadata.apiName,
                    dataType:metadata.dataType,
                    type:metadata.type,    
                    status:'Delete'              
                }
                if (metadata.referenceObjectApiName) {
                    metadataFieldDiff.referenceObjectApiName = metadata.referenceObjectApiName;
                }
                metadataFieldDiffs.push(metadataFieldDiff);
                return;
            }
        })
        
        return metadataFieldDiffs.sort((a,b) => a.apiName.localeCompare(b.apiName));
      }

      private splitApiNames(
        preApiNames:string[],
        currentApiNames:string[]
    ): {
        newApiNames:string[];
        deleteApiNames:string[]
      }{
        return {
            newApiNames:currentApiNames.filter((apiName) => !preApiNames.includes(apiName)),
            deleteApiNames:preApiNames.filter((apiName) => !currentApiNames.includes(apiName))
        }
      }

      private getPreObjectList(baseDir: string): MetadataObject[] {
        if (!fs.existsSync(baseDir)) {
            return [];
        }
        return MetadataParser.readMetadataObject(baseDir);
      }
    
      private getCurrentObjectList(baseDir:string): MetadataObject[] {
        if (!fs.existsSync(baseDir)) {
                return [];
        }

        const metadataObjects:MetadataObject[] = []
    
        const objectDirList = fs.readdirSync(baseDir, { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name);
            
        objectDirList.forEach((objectApiName) => {
            const metadataObject:MetadataObject = MetadataParser.parseSingleObject(objectApiName);
            const fieldPath = path.join(baseDir,objectApiName,'fields');
            const fieldApiNames = fs.readdirSync(fieldPath, {withFileTypes: true,})
                .filter((entry) =>entry.isFile() && entry.name.endsWith('.field-meta.xml'))
                .map((entry) => entry.name.replace('.field-meta.xml',''));
            metadataObject.fields = [
                ...metadataObject.fields,
                ...fieldApiNames.map((fieldApiName) =>
                    MetadataParser.parseSingleField(
                        this.objectDir,
                        objectApiName,
                        fieldApiName
                    )
                )
            ]
            metadataObjects.push(metadataObject);
        })
    
        return metadataObjects;
      }
}