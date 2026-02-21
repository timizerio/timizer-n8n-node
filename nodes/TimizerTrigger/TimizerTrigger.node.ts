import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

export class TimizerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Timizer Trigger',
		name: 'timizerTrigger',
		icon: 'file:../Timizer/timizer.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Timizer events occur',
		defaults: {
			name: 'Timizer Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'timizerApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: 'The events to listen for',
				options: [
					{
						name: 'Activity Report Created',
						value: 'activity_report.created',
					},
					{
						name: 'Activity Report Deleted',
						value: 'activity_report.deleted',
					},
					{
						name: 'Activity Report Refused',
						value: 'activity_report.refused',
					},
					{
						name: 'Activity Report Shared',
						value: 'activity_report.shared',
					},
					{
						name: 'Activity Report Signed',
						value: 'activity_report.signed',
					},
					{
						name: 'Activity Report Updated',
						value: 'activity_report.updated',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('timizerApi');
				const teamId = credentials.teamId as string;
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'timizerApi',
						{
							method: 'GET',
							url: `https://api.timizer.io/app/admin-teams/${teamId}/webhook`,
							json: true,
						},
					);

					if (response.url === webhookUrl && response.enable === true) {
						return true;
					}
				} catch {
					// Webhook not configured yet
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				// In test mode, don't register with Timizer (avoid overwriting the production URL)
				if (webhookUrl.includes('/webhook-test/')) {
					return true;
				}

				const credentials = await this.getCredentials('timizerApi');
				const teamId = credentials.teamId as string;

				const allEvents = [
					'activity_report.created',
					'activity_report.deleted',
					'activity_report.refused',
					'activity_report.shared',
					'activity_report.signed',
					'activity_report.updated',
				];

				await this.helpers.httpRequestWithAuthentication.call(this, 'timizerApi', {
					method: 'PUT',
					url: `https://api.timizer.io/app/admin-teams/${teamId}/webhook`,
					body: {
						url: webhookUrl,
						events: allEvents,
						enable: true,
					},
					json: true,
				});

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				// In test mode (webhook-test URL), don't disable the webhook on Timizer
				if (webhookUrl.includes('/webhook-test/')) {
					return true;
				}

				// In production mode (workflow deactivated), disable the webhook
				const credentials = await this.getCredentials('timizerApi');
				const teamId = credentials.teamId as string;

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'timizerApi', {
						method: 'PUT',
						url: `https://api.timizer.io/app/admin-teams/${teamId}/webhook`,
						body: {
							enable: false,
						},
						json: true,
					});
				} catch {
					return false;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events', []) as string[];

		if (events.length > 0 && body.event && !events.includes(body.event as string)) {
			return {
				noWebhookResponse: true,
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
