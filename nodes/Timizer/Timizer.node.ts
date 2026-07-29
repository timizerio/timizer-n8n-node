import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const CONTACT_FIELDS: INodeTypeDescription['properties'] = [
	{ displayName: 'First Name', name: 'firstname', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'lastname', type: 'string', default: '' },
	{ displayName: 'Email', name: 'email', type: 'string', default: '' },
	{ displayName: 'Occupation', name: 'occupation', type: 'string', default: '' },
];

// MissionInputDto. Note contractClientId, not contractedId, and start / end
// rather than startDate / endDate.
const MISSION_FIELDS: INodeTypeDescription['properties'] = [
	{ displayName: 'Name', name: 'name', type: 'string', default: '' },
	{ displayName: 'Custom ID', name: 'customId', type: 'string', default: '', description: 'Your own identifier for this mission' },
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: 'mission',
		options: [
			{ name: 'Mission', value: 'mission' },
			{ name: 'Project', value: 'project' },
		],
	},
	{ displayName: 'Client ID', name: 'clientId', type: 'number', default: 0 },
	{ displayName: 'Client Contact ID', name: 'clientContactId', type: 'number', default: 0 },
	{
		displayName: 'Contract Client ID',
		name: 'contractClientId',
		type: 'number',
		default: 0,
		description: 'Optional. When set together with Contract Client Contact ID, that contact receives the signed activity report by email.',
	},
	{ displayName: 'Contract Client Contact ID', name: 'contractClientContactId', type: 'number', default: 0 },
	{ displayName: 'Start', name: 'start', type: 'string', default: '', description: 'ISO 8601 datetime' },
	{ displayName: 'End', name: 'end', type: 'string', default: '', description: 'ISO 8601 datetime' },
	{ displayName: 'Note', name: 'note', type: 'string', default: '' },
	{ displayName: 'Purchase Order', name: 'purchaseOrder', type: 'string', default: '' },
];

// A Timizer tag carries two colours, not one, plus an optional external id.
const TAG_FIELDS: INodeTypeDescription['properties'] = [
	{ displayName: 'Custom ID', name: 'customId', type: 'string', default: '', description: 'Your own identifier for this tag' },
	{ displayName: 'Text Color', name: 'textColor', type: 'color', default: '' },
	{ displayName: 'Background Color', name: 'backgroundColor', type: 'color', default: '' },
];

// Optional properties of CreateActivityReportDto, shared by create and update.
const ACTIVITY_REPORT_OPTIONAL_FIELDS: INodeTypeDescription['properties'] = [
	{
		displayName: 'Mission ID',
		name: 'missionId',
		type: 'number',
		default: 0,
		description: 'When set, the mission\'s client and client contact are used and Client ID / Client Contact ID are ignored',
	},
	{ displayName: 'Client Contact ID', name: 'clientContactId', type: 'number', default: 0 },
	{ displayName: 'Contracted Contact ID', name: 'contractedContactId', type: 'number', default: 0 },
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: 'day',
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Hour', value: 'hour' },
		],
	},
	{ displayName: 'Rating', name: 'rating', type: 'number', default: 0 },
	{ displayName: 'Note', name: 'note', type: 'string', default: '' },
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'number',
		default: 0,
		description: 'The ID of the user that will own the activity report',
	},
];

const BASE_URL = 'https://api.timizer.io';

export class Timizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Timizer',
		name: 'timizer',
		icon: 'file:timizer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Timizer API',
		defaults: {
			name: 'Timizer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'timizerApi',
				required: true,
			},
		],
		properties: [
			// ------ Resource ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'activityReport',
				options: [
					{ name: 'Activity Report', value: 'activityReport' },
					{ name: 'Client', value: 'client' },
					{ name: 'Client Contact', value: 'clientContact' },
					{ name: 'Contracted', value: 'contracted' },
					{ name: 'Contracted Contact', value: 'contractedContact' },
					{ name: 'Mission', value: 'mission' },
					{ name: 'Tag', value: 'tag' },
					{ name: 'Team', value: 'team' },
					{ name: 'Team Member', value: 'teamMember' },
				],
			},

			// ====== OPERATIONS ======

			// --- Activity Report ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['activityReport'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create an activity report' },
					{ name: 'Delete', value: 'delete', action: 'Delete an activity report' },
					{ name: 'Get', value: 'get', action: 'Get an activity report' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many activity reports' },
					{ name: 'Get PDF', value: 'getPdf', action: 'Get activity report PDF' },
					{ name: 'Mark as Processed', value: 'markProcessed', action: 'Mark an activity report as processed' },
					{ name: 'Mark as Unprocessed', value: 'markUnprocessed', action: 'Mark an activity report as unprocessed' },
					{ name: 'Refuse', value: 'refuse', action: 'Refuse an activity report' },
					{ name: 'Share', value: 'share', action: 'Share an activity report' },
					{ name: 'Share by Email', value: 'shareByEmail', action: 'Share an activity report by email' },
					{ name: 'Update', value: 'update', action: 'Update an activity report' },
				],
			},

			// --- Client ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['client'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a client' },
					{ name: 'Delete', value: 'delete', action: 'Delete a client' },
					{ name: 'Get', value: 'get', action: 'Get a client' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many clients' },
					{ name: 'Update', value: 'update', action: 'Update a client' },
				],
			},

			// --- Client Contact ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['clientContact'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a client contact' },
					{ name: 'Delete', value: 'delete', action: 'Delete a client contact' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many client contacts' },
					{ name: 'Update', value: 'update', action: 'Update a client contact' },
				],
			},

			// --- Contracted ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contracted'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a contracted' },
					{ name: 'Delete', value: 'delete', action: 'Delete a contracted' },
					{ name: 'Get', value: 'get', action: 'Get a contracted' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many contracted' },
					{ name: 'Update', value: 'update', action: 'Update a contracted' },
				],
			},

			// --- Contracted Contact ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contractedContact'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a contracted contact' },
					{ name: 'Delete', value: 'delete', action: 'Delete a contracted contact' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many contracted contacts' },
					{ name: 'Update', value: 'update', action: 'Update a contracted contact' },
				],
			},

			// --- Mission ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['mission'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a mission' },
					{ name: 'Delete', value: 'delete', action: 'Delete a mission' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many missions' },
					{ name: 'Update', value: 'update', action: 'Update a mission' },
				],
			},

			// --- Tag ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tag'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a tag' },
					{ name: 'Delete', value: 'delete', action: 'Delete a tag' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many tags' },
					{ name: 'Update', value: 'update', action: 'Update a tag' },
				],
			},

			// --- Team ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['team'] } },
				default: 'getMany',
				options: [
					{ name: 'Create', value: 'create', action: 'Create a team' },
					{ name: 'Delete', value: 'delete', action: 'Delete a team' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many teams' },
					{ name: 'Update', value: 'update', action: 'Update a team' },
				],
			},

			// --- Team Member ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['teamMember'] } },
				default: 'getMany',
				options: [
					{ name: 'Delete', value: 'delete', action: 'Delete a team member' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many team members' },
					{ name: 'Invite', value: 'invite', action: 'Invite a team member' },
					{ name: 'Update', value: 'update', action: 'Update a team member' },
				],
			},

			// ====== FIELDS ======

			// --- Activity Report ID (for single operations) ---
			{
				displayName: 'Activity Report ID',
				name: 'activityReportId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['activityReport'],
						operation: ['get', 'update', 'delete', 'share', 'shareByEmail', 'refuse', 'markProcessed', 'markUnprocessed', 'getPdf'],
					},
				},
				description: 'The ID of the activity report',
			},

			// --- Activity Report Create fields ---
			// clientId, contractedId, year, month and workDays are the required
			// properties of CreateActivityReportDto.
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'ID of the client the activity report is for. Ignored if a Mission ID is set, the mission\'s client is used instead.',
			},
			{
				displayName: 'Contracted ID',
				name: 'contractedId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'ID of the contracted company the activity report is issued by',
			},
			{
				displayName: 'Month',
				name: 'month',
				type: 'number',
				required: true,
				default: 1,
				typeOptions: { minValue: 1, maxValue: 12 },
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'Month of the activity report (1-12)',
			},
			{
				displayName: 'Year',
				name: 'year',
				type: 'number',
				required: true,
				default: 2026,
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'Year of the activity report',
			},
			{
				displayName: 'Work Days',
				name: 'workDays',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add Work Day',
				default: {},
				required: true,
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create', 'update'] },
				},
				description: 'One entry per day of the month. Days left out are not reported.',
				options: [
					{
						displayName: 'Work Day',
						name: 'workDay',
						values: [
							{
								displayName: 'Day of Month',
								name: 'dayOfMonth',
								type: 'number',
								default: 1,
								typeOptions: { minValue: 1, maxValue: 31 },
							},
							{
								displayName: 'Worked Time',
								name: 'workedTime',
								type: 'options',
								default: 'full',
								options: [
									{ name: 'None', value: 'none' },
									{ name: 'Half', value: 'half' },
									{ name: 'Full', value: 'full' },
									{ name: 'Custom', value: 'custom' },
								],
							},
							{
								displayName: 'Worked Seconds',
								name: 'workedSeconds',
								type: 'number',
								default: 0,
								displayOptions: { show: { workedTime: ['custom'] } },
								description: 'Duration in seconds, used when Worked Time is Custom',
							},
							{
								displayName: 'Note',
								name: 'note',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				options: ACTIVITY_REPORT_OPTIONAL_FIELDS,
			},

			// --- Activity Report Update fields ---
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['update'] },
				},
				options: [
					{ displayName: 'Client ID', name: 'clientId', type: 'number', default: 0 },
					{ displayName: 'Contracted ID', name: 'contractedId', type: 'number', default: 0 },
					{ displayName: 'Month', name: 'month', type: 'number', default: 1, typeOptions: { minValue: 1, maxValue: 12 } },
					{ displayName: 'Year', name: 'year', type: 'number', default: 2026 },
					...ACTIVITY_REPORT_OPTIONAL_FIELDS,
				],
			},

			// --- Activity Report Share by Email ---
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'number',
				default: 0,
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['shareByEmail'] },
				},
				description: 'Contact to send the activity report to. Leave at 0 to use the activity report\'s client contact.',
			},

			// --- Activity Report Get Many filters ---
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['getMany'] },
				},
				options: [
					{
						displayName: 'Client ID',
						name: 'clientId',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Mission ID',
						name: 'missionId',
						type: 'string',
						default: '',
						description: 'ID of the mission. Comma separated to filter on several missions.',
					},
					{
						displayName: 'Month',
						name: 'month',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 1, maxValue: 12 },
						description: 'Year must be set as well',
					},
					{
						displayName: 'Since',
						name: 'since',
						type: 'number',
						default: 0,
						description: 'Unix timestamp. Only activity reports whose year and month are at or after it are returned.',
					},
					{
						displayName: 'Workflow Step Name',
						name: 'workflowStepName',
						type: 'string',
						default: '',
						description: 'Comma separated to filter on several steps',
					},
					{
						displayName: 'Year',
						name: 'year',
						type: 'number',
						default: 0,
						description: 'Month must be set as well',
					},
				],
			},

			// --- Client ID ---
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['client'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			// Client ID for contacts
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['clientContact'],
						operation: ['create', 'getMany', 'update', 'delete'],
					},
				},
				description: 'The ID of the client',
			},

			// --- Client Create/Update fields ---
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['client'], operation: ['create'] },
				},
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['client'], operation: ['update'] },
				},
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Full Address', name: 'fullAddress', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '', description: 'Alpha-2 code, e.g. fr, de' },
					{ displayName: 'Unique Identifier', name: 'uniqueIdentifier', type: 'string', default: '', description: 'e.g. SIRET number' },
					{ displayName: 'Archived', name: 'archived', type: 'boolean', default: false },
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['client'], operation: ['create'] },
				},
				options: [
					{ displayName: 'Full Address', name: 'fullAddress', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '', description: 'Alpha-2 code, e.g. fr, de' },
					{ displayName: 'Unique Identifier', name: 'uniqueIdentifier', type: 'string', default: '', description: 'e.g. SIRET number' },
					{ displayName: 'Team ID', name: 'teamId', type: 'number', default: 0, description: 'Set to make the client available to your team; leave empty to keep it private to your user' },
				],
			},

			// --- Client Contact fields ---
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['clientContact'],
						operation: ['update', 'delete'],
					},
				},
			},
			{
				displayName: 'Contact Fields',
				name: 'contactFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['clientContact'], operation: ['create'] },
				},
				options: CONTACT_FIELDS,
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['clientContact'], operation: ['update'] },
				},
				options: CONTACT_FIELDS,
			},

			// --- Contracted ID ---
			{
				displayName: 'Contracted ID',
				name: 'contractedId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['contracted'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			// Contracted ID for contacts
			{
				displayName: 'Contracted ID',
				name: 'contractedId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['contractedContact'],
						operation: ['create', 'getMany', 'update', 'delete'],
					},
				},
			},

			// --- Contracted Create/Update ---
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['contracted'], operation: ['create'] },
				},
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['contracted'], operation: ['update'] },
				},
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Full Address', name: 'fullAddress', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Unique Identifier', name: 'uniqueIdentifier', type: 'string', default: '', description: 'e.g. SIRET number' },
					{ displayName: 'Archived', name: 'archived', type: 'boolean', default: false },
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['contracted'], operation: ['create'] },
				},
				options: [
					{ displayName: 'Full Address', name: 'fullAddress', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Unique Identifier', name: 'uniqueIdentifier', type: 'string', default: '', description: 'e.g. SIRET number' },
					{ displayName: 'Team ID', name: 'teamId', type: 'number', default: 0, description: 'Set to make the contracted company available to your team; leave empty to keep it private to your user' },
				],
			},

			// --- Contracted Contact fields ---
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['contractedContact'],
						operation: ['update', 'delete'],
					},
				},
			},
			{
				displayName: 'Contact Fields',
				name: 'contactFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['contractedContact'], operation: ['create'] },
				},
				options: CONTACT_FIELDS,
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['contractedContact'], operation: ['update'] },
				},
				options: CONTACT_FIELDS,
			},

			// --- Mission ---
			{
				displayName: 'Mission ID',
				name: 'missionId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['mission'],
						operation: ['update', 'delete'],
					},
				},
			},
			{
				displayName: 'Mission Fields',
				name: 'missionFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['mission'], operation: ['create'] },
				},
				options: MISSION_FIELDS,
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['mission'], operation: ['update'] },
				},
				options: MISSION_FIELDS,
			},

			// --- Tag ---
			{
				displayName: 'Tag ID',
				name: 'tagId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['tag'], operation: ['update', 'delete'] },
				},
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['tag'], operation: ['create'] },
				},
				description: 'The tag label shown in Timizer',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['tag'], operation: ['create'] },
				},
				options: TAG_FIELDS,
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['tag'], operation: ['update'] },
				},
				options: [
					{ displayName: 'Label', name: 'label', type: 'string', default: '' },
					...TAG_FIELDS,
				],
			},

			// --- Team ---
			{
				displayName: 'Team ID',
				name: 'teamIdParam',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['team'], operation: ['update', 'delete'] },
				},
				description: 'The ID of the team',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['team'], operation: ['create'] },
				},
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['team'], operation: ['update'] },
				},
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Color', name: 'color', type: 'color', default: '' },
					{ displayName: 'Default Client ID', name: 'defaultClientId', type: 'number', default: 0 },
					{ displayName: 'Default Contracted ID', name: 'defaultContractedId', type: 'number', default: 0 },
					{ displayName: 'Activity Report Custom Text', name: 'activityReportCustomText', type: 'string', default: '', description: 'Up to 1024 characters' },
					{ displayName: 'Allow Admins to Create Activity Reports', name: 'allowAdminsToCreateActivityReports', type: 'boolean', default: false },
					{ displayName: 'Allow Hours Activity Reports', name: 'allowHoursActivityReports', type: 'boolean', default: false },
					{ displayName: 'Allow Non Signed Activity Report Sharing', name: 'allowNonSignedActivityReportSharing', type: 'boolean', default: false },
					{ displayName: 'Are Members Restricted to Team Only', name: 'areMembersRestrictedToTeamOnly', type: 'boolean', default: false },
					{ displayName: 'Force Default Contracted', name: 'forceDefaultContracted', type: 'boolean', default: false },
				],
			},

			// --- Team Member ---
			{
				displayName: 'Member ID',
				name: 'memberId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['teamMember'], operation: ['update', 'delete'] },
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['teamMember'], operation: ['invite'] },
				},
				description: 'Email of the member to invite',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['teamMember'], operation: ['invite'] },
				},
				options: [
					{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
					{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
					{ displayName: 'Note', name: 'note', type: 'string', default: '' },
					{ displayName: 'Is External User', name: 'isExternalUser', type: 'boolean', default: false, description: 'Whether the member is NOT part of your main company (e.g. an external freelancer)' },
					{ displayName: 'Send Emails', name: 'sendEmails', type: 'boolean', default: true, description: 'Whether to send the invitation email' },
				],
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['teamMember'], operation: ['update'] },
				},
				options: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						default: 'member',
						// The API enum is member and admin only.
						options: [
							{ name: 'Admin', value: 'admin' },
							{ name: 'Member', value: 'member' },
						],
					},
					{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
					{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
					{ displayName: 'Is Active', name: 'isActive', type: 'boolean', default: true },
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						description: 'Can only be changed if the member has never logged in before',
					},
				],
			},

			// --- Return All / Limit (for getMany operations) ---
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: { operation: ['getMany'] },
				},
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: { operation: ['getMany'], returnAll: [false] },
				},
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('timizerApi');
		const teamId = credentials.teamId as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];
				const method = getHttpMethod(resource, operation);
				const endpoint = buildEndpoint(resource, operation, teamId, this, i);
				const body = buildBody(resource, operation, this, i);

				if (operation === 'getPdf') {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'timizerApi',
						{
							method: 'GET',
							url: `${BASE_URL}${endpoint}`,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						},
					);
					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(response.body as Buffer),
						'activity-report.pdf',
						'application/pdf',
					);
					returnData.push({
						json: {},
						binary: { data: binaryData },
						pairedItem: { item: i },
					});
					continue;
				}

				const requestOptions: IHttpRequestOptions = {
					method,
					url: `${BASE_URL}${endpoint}`,
					json: true,
				};

				if (body && Object.keys(body).length > 0) {
					requestOptions.body = body;
				}

				if (operation === 'getMany') {
					const qs = buildQueryString(resource, this, i);
					if (Object.keys(qs).length > 0) {
						requestOptions.qs = qs;
					}
				}

				responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'timizerApi',
					requestOptions,
				);

				if (operation === 'getMany') {
					const results = Array.isArray(responseData) ? responseData : [responseData];
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (!returnAll) {
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = results.slice(0, limit);
					} else {
						responseData = results;
					}
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as IDataObject[]),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				} else {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as IDataObject),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}

// Resources whose update endpoint expects PATCH instead of PUT (per the Timizer API spec).
const PATCH_UPDATE_RESOURCES = new Set(['client', 'contracted', 'team', 'teamMember', 'activityReport']);

function getHttpMethod(resource: string, operation: string): IHttpRequestMethods {
	switch (operation) {
		case 'create':
		case 'share':
		case 'shareByEmail':
		case 'refuse':
		case 'invite':
			return 'POST';
		case 'markProcessed':
		case 'markUnprocessed':
			// The Timizer API exposes these as PUT /mark-as-processed and /mark-as-unprocessed.
			return 'PUT';
		case 'update':
			return PATCH_UPDATE_RESOURCES.has(resource) ? 'PATCH' : 'PUT';
		case 'delete':
			return 'DELETE';
		default:
			return 'GET';
	}
}

function buildEndpoint(
	resource: string,
	operation: string,
	teamId: string,
	ctx: IExecuteFunctions,
	i: number,
): string {
	const base = `/app/admin-teams/${teamId}`;

	switch (resource) {
		case 'activityReport': {
			const basePath = `${base}/activity-reports`;
			if (operation === 'getMany') return basePath;
			if (operation === 'create') return basePath;
			const id = ctx.getNodeParameter('activityReportId', i) as string;
			switch (operation) {
				case 'get': return `${basePath}/${id}`;
				case 'update': return `${basePath}/${id}`;
				case 'delete': return `${basePath}/${id}`;
				case 'share': return `${basePath}/${id}/share`;
				case 'shareByEmail': return `${basePath}/${id}/share-by-email`;
				case 'refuse': return `${basePath}/${id}/refuse`;
				case 'markProcessed': return `${basePath}/${id}/mark-as-processed`;
				case 'markUnprocessed': return `${basePath}/${id}/mark-as-unprocessed`;
				// The PDF endpoint is exposed at top level, not under /app/admin-teams/{teamId}.
				case 'getPdf': return `/app/activity-reports/${id}/pdf`;
				default: return basePath;
			}
		}

		case 'client': {
			// Clients are not scoped under /app/admin-teams/{teamId}; they live at /app/clients.
			const basePath = `/app/clients`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('clientId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'clientContact': {
			const clientId = ctx.getNodeParameter('clientId', i) as string;
			const basePath = `/app/clients/${clientId}/contacts`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const contactId = ctx.getNodeParameter('contactId', i) as string;
			return `${basePath}/${contactId}`;
		}

		case 'contracted': {
			// Contracted companies live at /app/contracted, not under /app/admin-teams/{teamId}.
			const basePath = `/app/contracted`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('contractedId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'contractedContact': {
			const contractedId = ctx.getNodeParameter('contractedId', i) as string;
			const basePath = `/app/contracted/${contractedId}/contacts`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const contactId = ctx.getNodeParameter('contactId', i) as string;
			return `${basePath}/${contactId}`;
		}

		case 'mission': {
			const basePath = `${base}/missions`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('missionId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'tag': {
			const basePath = `${base}/tags`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('tagId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'team': {
			const basePath = '/app/admin-teams';
			if (operation === 'getMany') return basePath;
			if (operation === 'create') return basePath;
			const id = ctx.getNodeParameter('teamIdParam', i) as string;
			return `${basePath}/${id}`;
		}

		case 'teamMember': {
			const basePath = `${base}/members`;
			if (operation === 'getMany') return basePath;
			// Invitations are created via a dedicated endpoint, not /members/invite.
			if (operation === 'invite') return `${base}/invitations`;
			const id = ctx.getNodeParameter('memberId', i) as string;
			return `${basePath}/${id}`;
		}

		default:
			return base;
	}
}

function buildBody(
	resource: string,
	operation: string,
	ctx: IExecuteFunctions,
	i: number,
): IDataObject {
	const body: IDataObject = {};

	if (operation === 'get' || operation === 'getMany' || operation === 'delete' || operation === 'getPdf') {
		return body;
	}

	switch (resource) {
		case 'activityReport': {
			if (operation === 'create') {
				body.clientId = ctx.getNodeParameter('clientId', i) as number;
				body.contractedId = ctx.getNodeParameter('contractedId', i) as number;
				body.month = ctx.getNodeParameter('month', i) as number;
				body.year = ctx.getNodeParameter('year', i) as number;
				body.workDays = collectWorkDays(ctx, i);
				Object.assign(body, ctx.getNodeParameter('additionalFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
				const workDays = collectWorkDays(ctx, i);
				if (workDays.length > 0) body.workDays = workDays;
			}
			if (operation === 'shareByEmail') {
				// Optional: the API falls back to the report's client contact.
				const contactId = ctx.getNodeParameter('contactId', i, 0) as number;
				if (contactId) body.contactId = contactId;
			}
			break;
		}

		case 'client': {
			if (operation === 'create') {
				body.name = ctx.getNodeParameter('name', i) as string;
				Object.assign(body, ctx.getNodeParameter('additionalFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'clientContact': {
			if (operation === 'create') {
				Object.assign(body, ctx.getNodeParameter('contactFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'contracted': {
			if (operation === 'create') {
				body.name = ctx.getNodeParameter('name', i) as string;
				Object.assign(body, ctx.getNodeParameter('additionalFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'contractedContact': {
			if (operation === 'create') {
				Object.assign(body, ctx.getNodeParameter('contactFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'mission': {
			if (operation === 'create') {
				Object.assign(body, ctx.getNodeParameter('missionFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'tag': {
			if (operation === 'create') {
				body.label = ctx.getNodeParameter('label', i) as string;
				Object.assign(body, ctx.getNodeParameter('additionalFields', i) as IDataObject);
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'team': {
			if (operation === 'create') {
				body.name = ctx.getNodeParameter('name', i) as string;
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}

		case 'teamMember': {
			if (operation === 'invite') {
				const additional = ctx.getNodeParameter('additionalFields', i) as IDataObject;
				const { sendEmails, ...invitationFields } = additional;
				const invitation: IDataObject = {
					email: ctx.getNodeParameter('email', i) as string,
					...invitationFields,
				};
				body.invitations = [invitation];
				// Only send the flag when the user actually set it. The API spec
				// declares sendEmails without a default, so forcing a value here
				// would invent a behaviour, and forcing true would email real
				// people on every execution.
				if (sendEmails !== undefined) body.sendEmails = sendEmails as boolean;
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}
	}

	return body;
}

// Flatten the Work Days fixedCollection into the array shape the API expects.
// workedSeconds is only meaningful when workedTime is "custom".
function collectWorkDays(ctx: IExecuteFunctions, i: number): IDataObject[] {
	const raw = ctx.getNodeParameter('workDays', i, {}) as IDataObject;
	const days = (raw.workDay as IDataObject[] | undefined) ?? [];
	return days.map((d) => {
		const day: IDataObject = {
			dayOfMonth: d.dayOfMonth,
			workedTime: d.workedTime,
		};
		if (d.workedTime === 'custom') day.workedSeconds = d.workedSeconds;
		if (d.note) day.note = d.note;
		return day;
	});
}

function buildQueryString(
	resource: string,
	ctx: IExecuteFunctions,
	i: number,
): IDataObject {
	const qs: IDataObject = {};

	if (resource === 'activityReport') {
		const filters = ctx.getNodeParameter('filters', i, {}) as IDataObject;
		if (filters.since) qs.since = filters.since;
		if (filters.month) qs.month = filters.month;
		if (filters.year) qs.year = filters.year;
		if (filters.clientId) qs.clientId = filters.clientId;
		// Both are repeatable array parameters on the API side.
		if (filters.missionId) qs.missionId = splitList(filters.missionId as string);
		if (filters.workflowStepName)
			qs.workflowStepName = splitList(filters.workflowStepName as string);
	}

	return qs;
}

function splitList(value: string): string[] {
	return value
		.split(',')
		.map((v) => v.trim())
		.filter((v) => v !== '');
}
