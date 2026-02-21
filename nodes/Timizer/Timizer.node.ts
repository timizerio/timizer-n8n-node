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
			{
				displayName: 'Member ID',
				name: 'memberId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'The ID of the member for this activity report',
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
				default: new Date().getFullYear(),
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['create'] },
				},
				description: 'Year of the activity report',
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
					{
						displayName: 'Comment',
						name: 'comment',
						type: 'string',
						default: '',
					},
				],
			},

			// --- Activity Report Share by Email ---
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['activityReport'], operation: ['shareByEmail'] },
				},
				description: 'The email to share the activity report with',
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
						displayName: 'Member ID',
						name: 'memberId',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Month',
						name: 'month',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 1, maxValue: 12 },
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{ name: 'Draft', value: 'draft' },
							{ name: 'Processed', value: 'processed' },
							{ name: 'Refused', value: 'refused' },
							{ name: 'Shared', value: 'shared' },
							{ name: 'Signed', value: 'signed' },
						],
					},
					{
						displayName: 'Year',
						name: 'year',
						type: 'number',
						default: 0,
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
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Zip Code', name: 'zipCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'SIRET', name: 'siret', type: 'string', default: '' },
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
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Zip Code', name: 'zipCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'SIRET', name: 'siret', type: 'string', default: '' },
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
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Zip Code', name: 'zipCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'SIRET', name: 'siret', type: 'string', default: '' },
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
					{ displayName: 'Address', name: 'address', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Zip Code', name: 'zipCode', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'SIRET', name: 'siret', type: 'string', default: '' },
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
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Client ID', name: 'clientId', type: 'string', default: '' },
					{ displayName: 'Contracted ID', name: 'contractedId', type: 'string', default: '' },
					{ displayName: 'Start Date', name: 'startDate', type: 'string', default: '', description: 'ISO 8601 date' },
					{ displayName: 'End Date', name: 'endDate', type: 'string', default: '', description: 'ISO 8601 date' },
				],
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
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Client ID', name: 'clientId', type: 'string', default: '' },
					{ displayName: 'Contracted ID', name: 'contractedId', type: 'string', default: '' },
					{ displayName: 'Start Date', name: 'startDate', type: 'string', default: '' },
					{ displayName: 'End Date', name: 'endDate', type: 'string', default: '' },
				],
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['tag'], operation: ['create'] },
				},
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
				options: [
					{ displayName: 'Color', name: 'color', type: 'string', default: '' },
				],
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
					{ displayName: 'Name', name: 'name', type: 'string', default: '' },
					{ displayName: 'Color', name: 'color', type: 'string', default: '' },
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
						options: [
							{ name: 'Admin', value: 'admin' },
							{ name: 'Manager', value: 'manager' },
							{ name: 'Member', value: 'member' },
						],
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
				const method = getHttpMethod(operation);
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

function getHttpMethod(operation: string): IHttpRequestMethods {
	switch (operation) {
		case 'create':
		case 'share':
		case 'shareByEmail':
		case 'refuse':
		case 'markProcessed':
		case 'markUnprocessed':
		case 'invite':
			return 'POST';
		case 'update':
			return 'PUT';
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
				case 'markProcessed': return `${basePath}/${id}/processed`;
				case 'markUnprocessed': return `${basePath}/${id}/unprocessed`;
				case 'getPdf': return `${basePath}/${id}/pdf`;
				default: return basePath;
			}
		}

		case 'client': {
			const basePath = `${base}/clients`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('clientId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'clientContact': {
			const clientId = ctx.getNodeParameter('clientId', i) as string;
			const basePath = `${base}/clients/${clientId}/contacts`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const contactId = ctx.getNodeParameter('contactId', i) as string;
			return `${basePath}/${contactId}`;
		}

		case 'contracted': {
			const basePath = `${base}/contracted`;
			if (operation === 'getMany' || operation === 'create') return basePath;
			const id = ctx.getNodeParameter('contractedId', i) as string;
			return `${basePath}/${id}`;
		}

		case 'contractedContact': {
			const contractedId = ctx.getNodeParameter('contractedId', i) as string;
			const basePath = `${base}/contracted/${contractedId}/contacts`;
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
			if (operation === 'invite') return `${basePath}/invite`;
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
				body.memberId = ctx.getNodeParameter('memberId', i) as string;
				body.month = ctx.getNodeParameter('month', i) as number;
				body.year = ctx.getNodeParameter('year', i) as number;
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			if (operation === 'shareByEmail') {
				body.email = ctx.getNodeParameter('email', i) as string;
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
				body.name = ctx.getNodeParameter('name', i) as string;
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
				body.email = ctx.getNodeParameter('email', i) as string;
			}
			if (operation === 'update') {
				Object.assign(body, ctx.getNodeParameter('updateFields', i) as IDataObject);
			}
			break;
		}
	}

	return body;
}

function buildQueryString(
	resource: string,
	ctx: IExecuteFunctions,
	i: number,
): IDataObject {
	const qs: IDataObject = {};

	if (resource === 'activityReport') {
		const filters = ctx.getNodeParameter('filters', i, {}) as IDataObject;
		if (filters.memberId) qs.memberId = filters.memberId;
		if (filters.month) qs.month = filters.month;
		if (filters.year) qs.year = filters.year;
		if (filters.status) qs.status = filters.status;
	}

	return qs;
}
