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
        source: z.enum(['permission', 'label', 'flow', 'layout', 'flexiPage', 'reference']),
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
        accessLevel: z.string().exactOptional().describe('USER_MODE / SYSTEM_MODE etc.'),
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
