import { z } from 'zod';

// レポートの data provider の出力のスキーマ (docs/implementation-roadmap.md 3 章。zod にそろえた)。
// 型は types.ts で z.infer して作る。説明 (.describe) は LLM 向けのカタログに出る (src/report/llmCatalog.ts)。
// 方針: docs/report-components-plan.md 3.2 章
// - 出力の各行は、元のノードの sourceKeys とファイルのパスを持つ (SourceSnippet と AI の注記の対象に使う)
// - status は差分を表示するとき (before を渡したとき) だけ持つ (Diff と同じ語彙)

export const ViewStatusSchema = z
    .enum(['added', 'removed', 'changed', 'unchanged'])
    .describe('Change since the saved state (only when comparing two points).');

export const ConvertKeysSchema = z
    .object({ objectKey: z.string(), sourceKey: z.string() })
    .describe('Position keys of the source node.');

/** 行の共通部分 */
export const rowBaseShape = {
    status: ViewStatusSchema.exactOptional(),
    filePath: z.string().exactOptional().describe('File of the row (relative to the repository).'),
    sourceKeys: ConvertKeysSchema.exactOptional(),
};

export const ValueChangeSchema = z
    .object({
        name: z.string(),
        before: z.unknown().exactOptional(),
        after: z.unknown().exactOptional(),
    })
    .describe('A changed property of the row.');

// ---------------------------------------------------------------------------
// 権限
// ---------------------------------------------------------------------------

export const PermissionHolderRefSchema = z.object({
    type: z.enum(['permissionSet', 'mutingPermissionSet', 'profile', 'permissionSetGroup']),
    name: z.string(),
});

export const PermissionDiffRowSchema = z
    .object({
        ...rowBaseShape,
        holder: PermissionHolderRefSchema,
        category: z
            .string()
            .describe(
                'XML element name (objectPermissions etc.). settings for root values, unit for added/removed sets.',
            ),
        target: z
            .string()
            .describe('Invoice__c / Invoice__c.Amount__c etc. Empty for settings and unit.'),
        changes: z.array(ValueChangeSchema),
    })
    .describe('One changed permission row of a permission set or profile.');

export const AccessFlagsSchema = z.object({
    allowCreate: z.boolean(),
    allowRead: z.boolean(),
    allowEdit: z.boolean(),
    allowDelete: z.boolean(),
    viewAllRecords: z.boolean(),
    modifyAllRecords: z.boolean(),
    viewAllFields: z.boolean(),
});

export const FieldAccessFlagsSchema = z.object({ readable: z.boolean(), editable: z.boolean() });

/** Matrix (行 × 列)。cells[行][列]。値のないセルは持たない */
export const matrixSchema = <V extends z.ZodType>(value: V) =>
    z
        .object({
            columns: z.array(PermissionHolderRefSchema),
            rows: z.array(z.string()),
            cells: z.record(
                z.string(),
                z.record(
                    z.string(),
                    z.object({
                        ...rowBaseShape,
                        before: value.exactOptional(),
                        after: value.exactOptional(),
                    }),
                ),
            ),
        })
        .describe('Matrix of rows x permission holders. cells[row][holder].');

export const ObjectAccessMatrixSchema = matrixSchema(AccessFlagsSchema);
export const FieldAccessMatrixSchema = matrixSchema(FieldAccessFlagsSchema);

export const ApexAccessRowSchema = z.object({
    ...rowBaseShape,
    holder: PermissionHolderRefSchema,
    accessType: z.enum(['apexClass', 'apexPage']),
    name: z.string(),
    enabled: z.boolean(),
});

export const EffectivePermissionRowSchema = z
    .object({
        ...rowBaseShape,
        group: z.string(),
        category: z.enum([
            'object',
            'field',
            'apexClass',
            'apexPage',
            'flow',
            'customPermission',
            'userPermission',
        ]),
        target: z.string(),
        before: z.union([z.string(), z.boolean()]).exactOptional(),
        after: z
            .union([z.string(), z.boolean()])
            .exactOptional()
            .describe('Objects: CRED etc. Fields: R / E. Others: true when enabled.'),
    })
    .describe('Effective permission of a permission set group (including muting).');

// ---------------------------------------------------------------------------
// Flow・自動化
// ---------------------------------------------------------------------------

export const FlowListRowSchema = z.object({
    ...rowBaseShape,
    name: z.string(),
    label: z.string().exactOptional(),
    processType: z.string().exactOptional(),
    triggerType: z.string().exactOptional(),
    recordTriggerType: z.string().exactOptional(),
    object: z.string().exactOptional(),
    flowStatus: z.string().exactOptional().describe('Active / Draft etc.'),
    elementCount: z.number(),
});

export const FlowDiagramSchema = z.object({
    flow: z.string(),
    nodes: z.array(
        z.object({
            ...rowBaseShape,
            id: z.string(),
            kind: z.string(),
            label: z.string().exactOptional(),
        }),
    ),
    edges: z.array(
        z.object({ ...rowBaseShape, from: z.string(), to: z.string(), edgeType: z.string() }),
    ),
});

export const FlowDiffRowSchema = z
    .object({
        ...rowBaseShape,
        flow: z.string(),
        element: z
            .string()
            .describe('Element or resource name ($start for the start, empty for flow settings).'),
        kind: z.string(),
        changedProperties: z.array(z.string()).describe('Names of changed properties.'),
    })
    .describe('A changed element, resource or start of a flow.');

export const ApexInterfaceRowSchema = z
    .object({
        ...rowBaseShape,
        className: z.string().describe('Outermost class of the unit.'),
        owner: z.string().describe('Owner type (Outer, Outer.Inner for inner classes).'),
        memberType: z.enum([
            'class',
            'interface',
            'enum',
            'method',
            'constructor',
            'property',
            'field',
        ]),
        name: z.string(),
        params: z.array(z.string()).exactOptional().describe('Parameter types.'),
        type: z.string().exactOptional().describe('Return type, property type, or enum values.'),
        access: z.enum(['global', 'public', 'annotated']),
        static: z.boolean(),
        annotations: z.array(z.string()),
        changedProperties: z.array(z.string()).exactOptional(),
    })
    .describe('A class or member of Apex usable from outside (global, public, @AuraEnabled etc.).');

export const LwcInterfaceRowSchema = z
    .object({
        ...rowBaseShape,
        component: z.string().describe('<namespace>/<bundle>'),
        memberType: z.enum(['property', 'method', 'event', 'slot']),
        name: z.string(),
        type: z.string().exactOptional(),
        params: z.array(z.string()).exactOptional(),
        accessor: z.enum(['field', 'get', 'set', 'get/set']).exactOptional(),
        changedProperties: z.array(z.string()).exactOptional(),
    })
    .describe('What a parent can use from an LWC: @api property/method, dispatched event, slot.');

export const FlowInterfaceRowSchema = z
    .object({
        ...rowBaseShape,
        flow: z.string(),
        variable: z.string(),
        direction: z.enum(['input', 'output', 'inputOutput']),
        dataType: z.string().exactOptional(),
        objectType: z.string().exactOptional(),
        apexClass: z.string().exactOptional(),
        isCollection: z.boolean(),
        changedProperties: z.array(z.string()).exactOptional(),
    })
    .describe('An input or output variable of a flow.');

export const FlowReferenceRowSchema = z.object({
    ...rowBaseShape,
    flow: z.string(),
    element: z.string(),
    refType: z.string(),
    value: z.string(),
    problem: z.string().exactOptional().describe('Finding code when the target does not exist.'),
});

export const AutomationRowSchema = z
    .object({
        object: z.string(),
        flows: z.array(
            z.object({
                ...rowBaseShape,
                name: z.string(),
                triggerType: z.string().exactOptional(),
                recordTriggerType: z.string().exactOptional(),
                triggerOrder: z.number().exactOptional(),
            }),
        ),
        triggers: z.array(
            z.object({
                ...rowBaseShape,
                name: z.string(),
                events: z.array(z.string()),
                triggerStatus: z.string().exactOptional(),
            }),
        ),
        validationRules: z.array(
            z.object({
                ...rowBaseShape,
                name: z.string(),
                active: z.boolean(),
                errorMessage: z.string().exactOptional(),
            }),
        ),
    })
    .describe('Automation of an object: record-triggered flows, Apex triggers, validation rules.');

// ---------------------------------------------------------------------------
// 画面
// ---------------------------------------------------------------------------

export const LayoutDetailSchema = z.object({
    ...rowBaseShape,
    name: z.string(),
    objectApiName: z.string(),
    sections: z.array(
        z.object({
            ...rowBaseShape,
            label: z.string(),
            columns: z.number(),
            items: z.array(
                z.object({
                    ...rowBaseShape,
                    field: z.string().exactOptional(),
                    other: z.string().exactOptional(),
                    behavior: z.string().exactOptional(),
                    column: z.number(),
                    row: z.number(),
                    movedFrom: z
                        .object({ section: z.string(), column: z.number(), row: z.number() })
                        .exactOptional(),
                }),
            ),
        }),
    ),
    relatedLists: z.array(
        z.object({ ...rowBaseShape, relatedList: z.string(), fields: z.array(z.string()) }),
    ),
    actions: z.array(
        z.object({
            ...rowBaseShape,
            actionName: z.string(),
            actionType: z.string().exactOptional(),
            sortOrder: z.number().exactOptional(),
        }),
    ),
});

export const FlexiPageDetailSchema = z.object({
    ...rowBaseShape,
    name: z.string(),
    label: z.string().exactOptional(),
    pageType: z.string().exactOptional(),
    sobjectType: z.string().exactOptional(),
    template: z.string().exactOptional(),
    regions: z.array(
        z.object({
            ...rowBaseShape,
            name: z.string(),
            items: z.array(
                z.object({
                    ...rowBaseShape,
                    identifier: z.string(),
                    itemType: z.enum(['component', 'field']),
                    name: z.string(),
                    properties: z.record(z.string(), z.string()),
                    hasVisibilityRule: z.boolean(),
                    movedFrom: z.string().exactOptional(),
                }),
            ),
        }),
    ),
});

export const LwcPlacementRowSchema = z.object({
    ...rowBaseShape,
    lwc: z.string(),
    flexiPage: z.string(),
    pageType: z.string().exactOptional(),
    sobjectType: z.string().exactOptional(),
    region: z.string(),
    properties: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// 横断
// ---------------------------------------------------------------------------

export const LabelUsageRowSchema = z.object({
    ...rowBaseShape,
    name: z.string(),
    value: z.string().exactOptional(),
    usages: z.array(z.object({ origin: z.string(), unit: z.string() })),
});

export const ReferenceUsageRowSchema = z.object({
    status: ViewStatusSchema.exactOptional(),
    refType: z.string(),
    target: z.string(),
    usedBy: z.array(
        z.object({
            from: z.string(),
            via: z.string(),
            filePath: z.string(),
            sourceKeys: ConvertKeysSchema.exactOptional(),
        }),
    ),
    problem: z.string().exactOptional(),
});

export const FindingRowSchema = z
    .object({
        ...rowBaseShape,
        source: z.enum([
            'permission',
            'label',
            'flow',
            'layout',
            'flexiPage',
            'reference',
            'repository',
            'apex',
        ]),
        code: z.string(),
        severity: z.enum(['error', 'warning', 'info']),
        unit: z.string().describe('Unit that raised the finding.'),
        target: z.string(),
        message: z.string(),
    })
    .describe(
        'A finding of the analysis. Comparing two points: new ones are added, gone ones removed.',
    );

// ---------------------------------------------------------------------------
// オブジェクト (ドキュメント・理解のため。既定は今の状態のすべて)
// ---------------------------------------------------------------------------

const changedPropertiesShape = {
    changedProperties: z
        .array(z.string())
        .exactOptional()
        .describe('Names of changed properties (only when comparing and the row changed).'),
};

export const ObjectListRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string().describe('API name.'),
        label: z.string().exactOptional(),
        pluralLabel: z.string().exactOptional(),
        objectType: z
            .string()
            .describe(
                'standard / custom / customMetadata / platformEvent / bigObject / externalObject.',
            ),
        description: z.string().exactOptional(),
        sharingModel: z.string().exactOptional(),
        deploymentStatus: z.string().exactOptional(),
        customSettingsType: z.string().exactOptional(),
        fieldCount: z
            .number()
            .describe('Fields defined in metadata (without implicit standard fields).'),
        validationRuleCount: z.number(),
        recordTypeCount: z.number(),
    })
    .describe('One object (custom / standard object, custom metadata type, platform event).');

export const ObjectFieldRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string(),
        field: z.string().describe('API name of the field.'),
        origin: z
            .enum(['metadata', 'implicit'])
            .describe(
                'implicit: standard fields every object has (Id, CreatedDate ...) without a file.',
            ),
        label: z.string().exactOptional(),
        type: z
            .string()
            .exactOptional()
            .describe('Salesforce field type (Text, Lookup, Picklist ...).'),
        required: z.boolean().exactOptional(),
        unique: z.boolean().exactOptional(),
        externalId: z.boolean().exactOptional(),
        length: z.number().exactOptional(),
        precision: z.number().exactOptional(),
        scale: z.number().exactOptional(),
        referenceTo: z
            .string()
            .exactOptional()
            .describe('Referenced object of a Lookup / MasterDetail.'),
        relationshipName: z.string().exactOptional(),
        deleteConstraint: z.string().exactOptional(),
        formula: z.string().exactOptional().describe('Formula of a formula field (as text).'),
        defaultValue: z.string().exactOptional().describe('Default value formula (as text).'),
        summary: z
            .string()
            .exactOptional()
            .describe('Roll-up summary: operation(summarized field) on the child object.'),
        valueSetName: z.string().exactOptional().describe('Global value set of a picklist.'),
        picklistValueCount: z.number().exactOptional(),
        picklistOrderChanged: z
            .literal(true)
            .exactOptional()
            .describe('The order of picklist values changed (only when comparing).'),
        helpText: z.string().exactOptional(),
        description: z.string().exactOptional(),
    })
    .describe('One field of an object.');

export const ObjectPicklistRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string(),
        field: z.string(),
        value: z
            .string()
            .exactOptional()
            .describe('API name of the value. Absent for a global value set.'),
        label: z.string().exactOptional(),
        order: z.number().exactOptional().describe('Position in the definition (1 based).'),
        isDefault: z.boolean().exactOptional(),
        isActive: z.boolean().exactOptional(),
        color: z.string().exactOptional(),
        controllingField: z.string().exactOptional(),
        controllingValues: z
            .array(z.string())
            .exactOptional()
            .describe(
                'Values of the controlling field that allow this value (dependent picklist).',
            ),
        valueSetName: z
            .string()
            .exactOptional()
            .describe('Global value set (values are defined there).'),
    })
    .describe('One picklist value (in definition order).');

export const ObjectValidationRuleRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string(),
        rule: z.string(),
        active: z.boolean().exactOptional(),
        condition: z.string().exactOptional().describe('Error condition formula (as text).'),
        errorMessage: z.string().exactOptional(),
        errorDisplayField: z.string().exactOptional(),
        description: z.string().exactOptional(),
    })
    .describe('One validation rule.');

export const ObjectRecordTypePicklistRowSchema = z
    .object({
        ...rowBaseShape,
        object: z.string(),
        recordType: z.string(),
        recordTypeLabel: z.string().exactOptional(),
        active: z.boolean().exactOptional(),
        picklist: z.string().describe('Picklist field.'),
        values: z.array(z.string()).describe('Values available in the record type.'),
        defaultValue: z.string().exactOptional(),
    })
    .describe('Picklist values available in one record type.');

export const ObjectDiagramSchema = z
    .object({
        objects: z.array(
            z.object({
                status: ViewStatusSchema.exactOptional(),
                name: z.string(),
                label: z.string().exactOptional(),
                objectType: z.string(),
                external: z
                    .literal(true)
                    .exactOptional()
                    .describe('Referenced but not in the repository (User etc.).'),
                fields: z.array(
                    z.object({
                        status: ViewStatusSchema.exactOptional(),
                        name: z.string(),
                        label: z.string().exactOptional(),
                        type: z.string().exactOptional(),
                        referenceTo: z.string().exactOptional(),
                    }),
                ),
            }),
        ),
        relations: z.array(
            z.object({
                status: ViewStatusSchema.exactOptional(),
                from: z.string().describe('Object that has the field.'),
                field: z.string(),
                to: z.string().describe('Referenced object.'),
                type: z.enum(['Lookup', 'MasterDetail']),
            }),
        ),
    })
    .describe('Entity relationship diagram of objects (lookup / master-detail).');

// ---------------------------------------------------------------------------
// Apex (ドキュメント・理解のため。既定は今の状態のすべて)
// ---------------------------------------------------------------------------

export const ApexOutlineRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        className: z.string().describe('Class or trigger name (the unit).'),
        unitType: z.enum(['class', 'trigger']),
        owner: z
            .string()
            .describe('Owner type (Outer, Outer.Inner). The trigger name for triggers.'),
        memberType: z.enum([
            'class',
            'interface',
            'enum',
            'method',
            'constructor',
            'property',
            'field',
            'trigger',
        ]),
        name: z.string(),
        params: z
            .array(z.string())
            .exactOptional()
            .describe('Parameter types (methods, constructors).'),
        type: z
            .string()
            .exactOptional()
            .describe(
                'Return type / property and field type / enum values / extended class / trigger object.',
            ),
        access: z
            .enum(['global', 'public', 'protected', 'private', 'annotated'])
            .exactOptional()
            .describe(
                'private when nothing is written. annotated: only exposed by @AuraEnabled etc.',
            ),
        static: z.boolean().exactOptional(),
        annotations: z.array(z.string()).exactOptional(),
        isTest: z.literal(true).exactOptional().describe('Member of a test class (@isTest).'),
        events: z
            .array(z.string())
            .exactOptional()
            .describe('Trigger events (before insert, after update ...).'),
    })
    .describe('One class, member or trigger (any access, including private and tests).');

/** 本体のメトリクスの、言語によらない項目 (apex.metrics・lwc.metrics で共通。数え方は processor/commons/metrics.ts) */
const bodyMetricsShape = {
    cyclomatic: z.number().describe('Cyclomatic complexity (counted from the syntax).'),
    cognitive: z.number().describe('Cognitive complexity (SonarSource rules).'),
    statements: z.number().describe('Number of statements (blocks are not counted).'),
    maxNesting: z.number().describe('Deepest nesting of if / loop / switch / try statements.'),
    calls: z.number().describe('Calls counted by the language analysis.'),
    callees: z.array(z.string()).describe('Called targets (sorted, unique).'),
};

export const LwcMetricsRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        component: z.string().describe('Component (namespace/name).'),
        module: z.string().describe('JS / TS file of the component (accountList.js).'),
        ownerKind: z
            .enum(['lwcComponent', 'lwcClass', 'lwcDeclaration', 'module'])
            .describe(
                'Component member, other class member, top-level declaration or top-level statements.',
            ),
        owner: z.string().exactOptional().describe('Component, class or declaration name.'),
        member: z.string().exactOptional().describe('Member name (static for a static block).'),
        ...bodyMetricsShape,
        apexCalls: z
            .number()
            .describe('Imperative calls of Apex methods imported from @salesforce/apex.'),
        apexCallsInLoop: z
            .number()
            .describe('Apex calls in a loop (more round trips to the server).'),
        events: z.number().describe('this.dispatchEvent calls.'),
    })
    .describe(
        'Metrics of one body (method, getter, function ...) of an LWC module. Comparing two points: changed values.',
    );

export const ApexMetricsRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        className: z.string().describe('Class, trigger or anonymous Apex name (the unit).'),
        unitType: z.enum(['class', 'trigger', 'anonymous']),
        member: z
            .string()
            .exactOptional()
            .describe('Method etc. (Class.method). Getter and setter share the property name.'),
        bodyKind: z
            .enum([
                'method',
                'constructor',
                'initializer',
                'getter',
                'setter',
                'trigger',
                'anonymous',
                'fieldInitializer',
            ])
            .describe('Kind of the executable body.'),
        name: z.string().describe('Names of the declaration that owns the body, joined by dots.'),
        signature: z
            .string()
            .exactOptional()
            .describe(
                'Method or constructor name with parameter types (calc(Integer)). Tells overloads apart.',
            ),
        inTest: z.boolean().describe('In a test class or test method.'),
        // 言語によらない項目 (calls は Apex ではメソッドの呼び出し。new は数えない。callees は Owner.method)
        ...bodyMetricsShape,
        soql: z.number().describe('SOQL queries, including Database.query etc.'),
        soqlInLoop: z.number(),
        sosl: z.number(),
        soslInLoop: z.number(),
        dml: z.number().describe('DML statements and Database.insert etc.'),
        dmlInLoop: z.number(),
    })
    .describe('Metrics of one executable body of Apex. Comparing two points: changed values.');

export const ApexUnusedMethodRowSchema = z
    .object({
        ...rowBaseShape,
        className: z.string().describe('Class (the unit).'),
        member: z
            .string()
            .describe('Method (Class.method, Outer.Inner.method). Overloads are judged together.'),
        access: z.enum(['global', 'public', 'protected', 'private']),
        isStatic: z.boolean(),
        overloads: z.number().describe('Number of methods with this name.'),
        verdict: z
            .enum(['unused', 'candidateOnly'])
            .describe(
                'unused: no call and no candidate call / candidateOnly: only possible calls through an interface or a superclass type.',
            ),
    })
    .describe(
        'An Apex method nothing calls (a clean-up candidate). Entry points (tests, @AuraEnabled, @InvocableMethod, @RemoteAction, REST, global, webservice, standard interface implementations, Visualforce controllers) are not listed.',
    );

export const ApexEntryPointRowSchema = z
    .object({
        ...rowBaseShape,
        className: z.string().describe('Class (the unit).'),
        member: z.string().describe('Method (Class.method, Outer.Inner.method).'),
        kind: z
            .enum(['rest', 'aura', 'invocable', 'remoteAction', 'webservice', 'future'])
            .describe(
                'rest: @Http* in a @RestResource class / aura: @AuraEnabled / invocable: @InvocableMethod / remoteAction: @RemoteAction / webservice: webservice / future: @future.',
            ),
        httpMethod: z.string().exactOptional().describe('rest: GET / POST / PUT / PATCH / DELETE.'),
        urlMapping: z.string().exactOptional().describe('rest: urlMapping of @RestResource.'),
        cacheable: z.boolean().exactOptional().describe('aura: @AuraEnabled(cacheable=true).'),
        label: z.string().exactOptional().describe('invocable: label of @InvocableMethod.'),
        callout: z.boolean().exactOptional().describe('future: @future(callout=true).'),
        usedBy: z
            .array(z.string())
            .describe(
                'Other units that call the method in the repository (<type>:<name>, e.g. lwc:accountList, flow:Invoice_Flow).',
            ),
    })
    .describe(
        'An entry point of Apex called from outside Apex (screens, Flow, external systems, async execution). One row per kind.',
    );

export const ObjectUsageRowSchema = z
    .object({
        object: z.string().describe('Object API name.'),
        objectOrigin: z
            .string()
            .describe('repository / standard / missing / unknown (from the dependency graph).'),
        unitType: z
            .string()
            .describe('Type of the unit that uses the object (apexClass, lwc, flow ...).'),
        unit: z.string(),
        operations: z
            .array(
                z.enum([
                    'query',
                    'read',
                    'insert',
                    'update',
                    'upsert',
                    'delete',
                    'undelete',
                    'merge',
                    'write',
                    'publish',
                    'trigger',
                    'grant',
                    'place',
                    'use',
                ]),
            )
            .describe(
                'Operations on the object and its fields (trigger: the trigger is on it / grant: permissions / place: layouts and pages).',
            ),
        fieldsRead: z
            .array(z.string())
            .describe('Fields the unit reads or queries (Object.Field).'),
        fieldsWritten: z.array(z.string()).describe('Fields the unit assigns.'),
    })
    .describe('How one unit uses one object (a CRUD-like usage table).');

export const ApexTriggerHandlerRowSchema = z
    .object({
        trigger: z.string(),
        object: z.string().exactOptional().describe('Object of the trigger.'),
        events: z.array(z.string()).exactOptional().describe('Trigger events (before insert ...).'),
        handler: z.string().describe('Class reached by following calls from the trigger.'),
        depth: z.number().describe('1 for classes the trigger calls directly.'),
        path: z.array(z.string()).describe('Classes from the trigger to the handler.'),
    })
    .describe('A class an Apex trigger reaches by calls (its handler and what it calls).');

export const ApexTestRowSchema = z
    .object({
        unitType: z.enum(['class', 'trigger']),
        name: z.string(),
        tests: z
            .array(
                z.object({
                    test: z.string().describe('Test class.'),
                    via: z
                        .enum(['call', 'dml'])
                        .describe(
                            'call: reached by calls / dml: reached through a trigger fired by DML on the way.',
                        ),
                    depth: z.number(),
                }),
            )
            .describe('Test classes that reach this class or trigger. Empty means untested.'),
    })
    .describe('Which test classes exercise an Apex class or trigger.');

export const ApexDataAccessRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        className: z.string().describe('Class, trigger or anonymous Apex name (the unit).'),
        unitType: z.enum(['class', 'trigger', 'anonymous']),
        member: z
            .string()
            .exactOptional()
            .describe('Method etc. (Class.method). Absent at unit level.'),
        operation: z
            .enum([
                'select',
                'search',
                'dynamicQuery',
                'insert',
                'update',
                'upsert',
                'delete',
                'undelete',
                'merge',
            ])
            .describe(
                'select: SOQL / search: SOSL / dynamicQuery: Database.query etc. / DML operations.',
            ),
        object: z
            .string()
            .exactOptional()
            .describe('Target object (absent when it cannot be known).'),
        fields: z
            .array(z.string())
            .describe(
                'Fields read by the query (SELECT / WHERE / ORDER BY / GROUP BY), or for DML the fields assigned in the same method on that object.',
            ),
        via: z
            .enum(['soql', 'sosl', 'dynamic', 'statement', 'database'])
            .describe('statement: DML statement / database: Database.insert etc.'),
        inLoop: z.boolean().describe('Inside a loop (a common cause of governor limit errors).'),
        inTest: z.boolean().describe('In a test class or test method.'),
        accessLevel: z
            .string()
            .exactOptional()
            .describe(
                'DML: USER_MODE / SYSTEM_MODE (AccessLevel), USER / SYSTEM (as user / as system). Query: WITH USER_MODE / SYSTEM_MODE / SECURITY_ENFORCED.',
            ),
        allOrNone: z.boolean().exactOptional(),
    })
    .describe(
        'One SOQL / SOSL query or DML operation: which object and fields the code reads or writes.',
    );

// ---------------------------------------------------------------------------
// LWC (ドキュメント・理解のため。既定は今の状態のすべて)
// ---------------------------------------------------------------------------

export const LwcComponentRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        component: z.string().describe('namespace/name (c/accountList).'),
        label: z.string().exactOptional().describe('masterLabel of js-meta.xml.'),
        description: z.string().exactOptional(),
        isExposed: z.boolean().exactOptional(),
        targets: z
            .array(z.string())
            .describe('Where it can be placed (lightning__RecordPage ...).'),
        apiVersion: z.string().exactOptional(),
        language: z.enum(['js', 'ts']).exactOptional(),
        apiProperties: z
            .array(z.string())
            .describe('@api properties (attributes a parent can set).'),
        events: z.array(z.string()).describe('Events it dispatches.'),
        childComponents: z.array(z.string()).describe('Custom components used in the templates.'),
        baseComponents: z.array(z.string()).describe('Base components (lightning/card ...).'),
        apexMethods: z.array(z.string()).describe('Apex methods it imports (Class.method).'),
        objects: z
            .array(z.string())
            .describe('Objects it reads or writes (from @salesforce/schema and record forms).'),
        findingCount: z
            .number()
            .describe('Possible mismatches found by the analysis (lwc.detail lists them).'),
    })
    .describe('One Lightning web component (bundle).');

export const LwcDetailRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        component: z.string(),
        category: z
            .enum([
                'property',
                'method',
                'event',
                'slot',
                'wire',
                'apex',
                'child',
                'baseComponent',
                'object',
                'field',
                'label',
                'customPermission',
                'resource',
                'messageChannel',
                'finding',
            ])
            .describe(
                'property / method / event / slot: what a parent can use. wire: @wire members. apex: imported Apex methods. child / baseComponent: components used. object / field: data it uses. label / customPermission / resource / messageChannel: other imports. finding: possible mismatch.',
            ),
        name: z.string(),
        detail: z
            .string()
            .exactOptional()
            .describe('Type, adapter and parameters, how it is used, or the message of a finding.'),
    })
    .describe('One item of a component: its public interface, data, and dependencies.');

/** ワイヤーフレームのノード 1 つ (テンプレートの要素・テキスト・分岐・繰り返し・slot) */
export type WireframeNode = {
    type: 'element' | 'component' | 'text' | 'slot' | 'if' | 'for';
    tag?: string;
    module?: string;
    source?: 'local' | 'lightning' | 'package';
    text?: string;
    attributes?: { name: string; value: string }[];
    events?: string[];
    branches?: { label: string; children: WireframeNode[] }[];
    items?: string;
    children?: WireframeNode[];
};

export const WireframeNodeSchema: z.ZodType<WireframeNode> = z.lazy(() =>
    z.object({
        type: z
            .enum(['element', 'component', 'text', 'slot', 'if', 'for'])
            .describe(
                'element: HTML / component: c-* or lightning-* / text (expressions as {x}) / slot / if: branches / for: repeated children.',
            ),
        tag: z.string().exactOptional(),
        module: z.string().exactOptional().describe('c/accountRow, lightning/button ...'),
        source: z.enum(['local', 'lightning', 'package']).exactOptional(),
        text: z
            .string()
            .exactOptional()
            .describe('Text, slot name, or the condition / items expression.'),
        attributes: z
            .array(z.object({ name: z.string(), value: z.string() }))
            .exactOptional()
            .describe('Attributes as written ({x} for expressions).'),
        events: z.array(z.string()).exactOptional().describe('Event handlers (onclick → click).'),
        branches: z
            .array(z.object({ label: z.string(), children: z.array(WireframeNodeSchema) }))
            .exactOptional()
            .describe('Branches of lwc:if / lwc:elseif / lwc:else (if:true / if:false).'),
        items: z.string().exactOptional().describe('Expression of for:each / iterator.'),
        children: z.array(WireframeNodeSchema).exactOptional(),
    }),
);

export const LwcWireframeSchema = z
    .object({
        roots: z.array(z.string()).describe('Components to show (namespace/name).'),
        components: z.array(
            z.object({
                status: ViewStatusSchema.exactOptional(),
                component: z.string(),
                label: z.string().exactOptional(),
                templates: z.array(
                    z.object({
                        fileName: z.string(),
                        main: z.boolean(),
                        nodes: z.array(WireframeNodeSchema),
                    }),
                ),
            }),
        ),
    })
    .describe(
        'Wireframes of components built from their templates (no JS is run). Includes the local child components used by the roots so they can be expanded.',
    );

// ---------------------------------------------------------------------------
// 翻訳 (ドキュメント・理解のため。既定は今の状態のすべての言語)
// ---------------------------------------------------------------------------

const TranslationStatusSchema = z
    .enum(['translated', 'missing', 'sameAsSource', 'orphan', 'outdated'])
    .describe(
        'translated / missing: no translation / sameAsSource: same text as the source (possibly forgotten) / orphan: translation of something the object does not have / outdated: the source changed but the translation did not (only when comparing).',
    );

export const TranslationCoverageRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string(),
        language: z.string().describe('Locale (ja, en_US ...).'),
        objectFound: z.boolean().describe('The object is in the repository (custom objects).'),
        total: z.number().describe('Items to translate (labels, help, picklist values ...).'),
        translated: z.number(),
        missing: z.number(),
        sameAsSource: z.number(),
        orphan: z.number(),
        outdated: z.number(),
        coverage: z.number().describe('Translated items / items of the object (0-100, rounded).'),
    })
    .describe('Translation coverage of one object in one language.');

export const TranslationItemRowSchema = z
    .object({
        ...rowBaseShape,
        ...changedPropertiesShape,
        object: z.string(),
        language: z.string(),
        kind: z
            .enum([
                'fieldLabel',
                'fieldHelp',
                'relationshipLabel',
                'picklistValue',
                'validationRule',
                'recordType',
                'webLink',
                'fieldSet',
            ])
            .describe('What is translated.'),
        name: z.string().describe('Field API name, Field.Value for picklist values, or fullName.'),
        source: z.string().exactOptional().describe('Text in the object (source language).'),
        translation: z.string().exactOptional(),
        translationStatus: TranslationStatusSchema,
    })
    .describe('One translatable item of an object in one language.');

// ---------------------------------------------------------------------------
// すべての種類の土台 (ドキュメント・理解のため。docs/todo.md 2.1)
// ---------------------------------------------------------------------------

export const MetadataUnitRowSchema = z
    .object({
        ...rowBaseShape,
        unitType: z.string().describe('Unit type (customTab, namedCredential, apexClass ...).'),
        name: z.string(),
        label: z.string().exactOptional(),
        description: z.string().exactOptional(),
        readable: z.boolean().describe('false when the file could not be read (see errorCount).'),
        errorCount: z.number().describe('Problems found while reading (syntax errors etc.).'),
        skippedElements: z
            .array(z.string())
            .exactOptional()
            .describe('XML elements this analyzer does not read yet.'),
    })
    .describe('One unit (file or folder) of any type.');

export const MetadataTypeRowSchema = z
    .object({
        unitType: z.string(),
        lineage: z.string().describe('apex / lwc / object / objectTranslation / metadata.'),
        count: z.number(),
        unreadable: z.number(),
        withErrors: z.number(),
        added: z.number().exactOptional().describe('Only when comparing.'),
        removed: z.number().exactOptional(),
        changed: z.number().exactOptional(),
    })
    .describe('Number of units of one type.');

export const MetadataPropertyRowSchema = z
    .object({
        ...rowBaseShape,
        unitType: z.string(),
        name: z.string().describe('Unit name.'),
        path: z
            .string()
            .describe(
                'Where the value is, e.g. label or sharingCriteriaRules[Large_Invoices].accessLevel (array items by their name).',
            ),
        value: z
            .union([z.string(), z.number(), z.boolean()])
            .describe(
                'Formulas as text, criteria as "left operator right". Sensitive values are masked.',
            ),
        before: z
            .union([z.string(), z.number(), z.boolean()])
            .exactOptional()
            .describe('Value before (only for changed rows when comparing).'),
    })
    .describe('One setting of a unit (any XML metadata type; Apex and LWC only their -meta.xml).');

// ---------------------------------------------------------------------------
// 宣言単位 (オブジェクトの子・Flow の要素・ラベル。docs/todo.md 2.2)
// ---------------------------------------------------------------------------

const detailsShape = {
    details: z
        .array(z.string())
        .describe(
            'Contents as "path = value" (formulas as text, criteria as "left operator right").',
        ),
    changedDetails: z
        .array(z.string())
        .exactOptional()
        .describe('Contents that are new or different (only when comparing and the row changed).'),
};

export const ObjectMemberRowSchema = z
    .object({
        status: ViewStatusSchema.exactOptional(),
        filePath: z.string().exactOptional(),
        object: z.string(),
        memberType: z.enum([
            'recordType',
            'listView',
            'fieldSet',
            'compactLayout',
            'webLink',
            'businessProcess',
            'sharingReason',
            'actionOverride',
            'searchLayout',
        ]),
        name: z.string(),
        label: z.string().exactOptional(),
        description: z.string().exactOptional(),
        ...detailsShape,
    })
    .describe(
        'One child of an object (record type, list view, field set, compact layout, button / link, business process, sharing reason, action override, search layout).',
    );

export const FlowElementRowSchema = z
    .object({
        status: ViewStatusSchema.exactOptional(),
        filePath: z.string().exactOptional(),
        flow: z.string(),
        element: z.string().describe('API name of the element.'),
        kind: z.string().describe('flowDecision, flowAssignment, flowRecordLookup, flowScreen ...'),
        order: z.number().describe('Position in the flow file (1 based).'),
        label: z.string().exactOptional(),
        description: z.string().exactOptional(),
        object: z.string().exactOptional().describe('Object of a record operation.'),
        ...detailsShape,
    })
    .describe(
        'One element of a flow with its contents (conditions, assignments, record filters, screen fields, action inputs).',
    );

export const LabelDefinitionRowSchema = z
    .object({
        status: ViewStatusSchema.exactOptional(),
        filePath: z.string().exactOptional(),
        label: z.string().describe('API name of the custom label.'),
        value: z.string(),
        language: z.string().exactOptional(),
        protected: z.boolean().exactOptional(),
        shortDescription: z.string().exactOptional(),
        categories: z.array(z.string()),
        translations: z
            .array(z.string())
            .describe('Translations in the translations metadata, as "language: text".'),
        missingLanguages: z
            .array(z.string())
            .describe(
                'Languages of the translations metadata that have no translation of this label.',
            ),
    })
    .describe('One custom label and its translations.');

// ---------------------------------------------------------------------------
// 処理フロー (docs/todo.md 3.2.1 の 4)
// ---------------------------------------------------------------------------

export const CodeFlowNodeSchema = z
    .object({
        id: z.string(),
        kind: z
            .enum([
                'start',
                'end',
                'process',
                'decision',
                'loop',
                'query',
                'dml',
                'callout',
                'event',
                'call',
                'navigate',
                'try',
                'catch',
                'finally',
                'return',
                'throw',
            ])
            .describe(
                'process: statements merged into one box / decision: if or switch / loop: for or while / query: SOQL, SOSL / dml: insert, update ... / callout: HTTP / event: publishing events / call: calling server code (Apex from LWC) / navigate: page navigation.',
            ),
        label: z.string().describe('Text of the box (the first line of the source).'),
        detail: z.string().exactOptional().describe('Source of the statements (up to 20 lines).'),
        line: z.number().exactOptional().describe('Line in the file (1-based).'),
        count: z.number().exactOptional().describe('Number of statements merged into the box.'),
        inLoop: z
            .boolean()
            .exactOptional()
            .describe('Inside a loop (SOQL / DML here can hit governor limits).'),
    })
    .describe('One box of a code flowchart.');

export const CodeFlowEdgeSchema = z
    .object({
        from: z.string(),
        to: z.string(),
        kind: z
            .enum(['normal', 'yes', 'no', 'case', 'loop', 'back', 'exception'])
            .describe(
                'yes / no: branches of a decision / case: a when of switch / loop: into the loop body / back: back to the loop head / exception: to catch or out by throw.',
            ),
        label: z.string().exactOptional(),
    })
    .describe('One line of a code flowchart.');

export const CodeFlowSchema = z
    .object({
        filePath: z.string().exactOptional(),
        language: z.enum(['apex', 'lwc']),
        unit: z.string().describe('Class, trigger or component name.'),
        owner: z.string().describe('Type that has the member (Outer.Inner for inner classes).'),
        memberType: z.enum(['method', 'constructor', 'trigger', 'anonymous', 'function']),
        name: z.string(),
        member: z.string().describe('owner.name (the same as member of apex.dataAccess).'),
        signature: z
            .string()
            .describe(
                'name(param types) to tell overloads apart, e.g. calc(Integer, Integer). In a for over apex.outline: "${m.name}(${m.params})".',
            ),
        nodes: z.array(CodeFlowNodeSchema),
        edges: z.array(CodeFlowEdgeSchema),
    })
    .describe('Flowchart of one method / function, built from its statements.');

export const CallSequenceMessageSchema = z
    .object({
        from: z.string().describe('Participant that sends (class, trigger).'),
        to: z
            .string()
            .describe('Participant that receives (class, Database, EventBus, Http, System ...).'),
        label: z
            .string()
            .describe('Method name, or the operation and object (SELECT Account, update Account).'),
        kind: z
            .enum(['call', 'query', 'dml', 'async', 'callout', 'publish'])
            .describe(
                'call: a method of a class in the repository / query: SOQL, SOSL / dml / async: Queueable, Batch, Schedule / callout: HTTP / publish: platform events.',
            ),
        depth: z.number().describe('1 for the start method, 2 for the methods it calls ...'),
        line: z.number().exactOptional().describe('Line of the call in its file.'),
        inLoop: z
            .boolean()
            .exactOptional()
            .describe('Inside a loop (SOQL / DML here can hit governor limits).'),
    })
    .describe('One message of a sequence diagram.');

export const CallSequenceSchema = z
    .object({
        start: z.string().describe('Start member (Owner.method, or the trigger name).'),
        unit: z.string().describe('Class or trigger of the start member.'),
        participants: z
            .array(z.string())
            .describe('Participants from the left (the start class first).'),
        messages: z
            .array(CallSequenceMessageSchema)
            .describe('Messages in the order of the source (depth-first into called methods).'),
        truncated: z
            .boolean()
            .exactOptional()
            .describe('Too many messages; the rest are not shown.'),
    })
    .describe(
        'Sequence diagram of calls from one method, following the methods of the repository classes.',
    );

export const EventFlowNodeSchema = z
    .object({
        id: z.string(),
        kind: z
            .enum([
                'action',
                'lifecycle',
                'wire',
                'handler',
                'apex',
                'refresh',
                'event',
                'toast',
                'navigate',
                'message',
            ])
            .describe(
                'action: an event in the template (<lightning-button> click) / lifecycle: connectedCallback ... / wire: @wire / handler: a method of the component / apex: an Apex method / refresh: refreshApex / event: an event the component dispatches / toast / navigate / message: Lightning Message Service publish.',
            ),
        label: z.string(),
        component: z
            .string()
            .exactOptional()
            .describe('Component that has the box (Apex methods have none).'),
    })
    .describe('One box of an event flow.');

export const EventFlowEdgeSchema = z
    .object({
        from: z.string(),
        to: z.string(),
        kind: z
            .enum(['flow', 'data', 'event'])
            .describe(
                'flow: calls and order / data: Apex and @wire / event: dispatching events and handling them in the parent.',
            ),
        label: z.string().exactOptional(),
    })
    .describe('One line of an event flow.');

export const EventFlowSchema = z
    .object({
        components: z
            .array(z.string())
            .describe('Components in the chart (the start components and their children).'),
        nodes: z.array(EventFlowNodeSchema),
        edges: z.array(EventFlowEdgeSchema),
    })
    .describe(
        'Flow from user actions (template events), @wire and lifecycle hooks to handlers, Apex, events, toasts and navigation, across parent and child components.',
    );

export const FeatureScopeRowSchema = z
    .object({
        filePath: z.string().exactOptional(),
        nodeId: z.string().describe('Node id (object:Invoice__c, apexClass:AccountService ...).'),
        unitType: z.string(),
        name: z.string(),
        relation: z
            .enum(['target', 'uses', 'usedBy', 'both'])
            .describe(
                'target: a start point / uses: the targets use it / usedBy: it uses the targets / both.',
            ),
        depth: z.number().describe('Steps from the nearest target (0 for targets).'),
    })
    .describe(
        'One unit in the scope of a feature (found by following dependencies from the targets).',
    );

// ---------------------------------------------------------------------------
// 依存関係
// ---------------------------------------------------------------------------

export const DependencyNodeRowSchema = z.object({
    ...rowBaseShape,
    id: z.string().describe('Node id (field:Invoice__c.Amount__c, apexClass:AccountService etc.).'),
    type: z.string(),
    name: z.string(),
    origin: z.string(),
    depth: z.number().exactOptional().describe('Depth at which the node was found.'),
});

export const DependencyImpactSchema = z.object({
    changed: z.array(DependencyNodeRowSchema),
    impacted: z.array(DependencyNodeRowSchema),
});

export const DependencyMissingRowSchema = z.object({
    code: z.string(),
    severity: z.enum(['warning', 'info']),
    target: z.string(),
    from: z.string(),
    unit: z.string(),
    message: z.string(),
    sourceKeys: ConvertKeysSchema.exactOptional(),
});

export const DependencyChangeRowSchema = z.object({
    from: z.string(),
    to: z.string(),
    kind: z.string(),
    status: z.enum(['added', 'removed']),
});

export const DependencyDiagramSchema = z.object({
    format: z.enum(['mermaid', 'dot']),
    text: z.string(),
});
