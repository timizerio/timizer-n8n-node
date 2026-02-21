import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TimizerApi implements ICredentialType {
	name = 'timizerApi';
	displayName = 'Timizer API';
	documentationUrl = 'https://api-doc.timizer.io/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Timizer API key',
		},
		{
			displayName: 'Team ID',
			name: 'teamId',
			type: 'string',
			default: '',
			required: true,
			description: 'The ID of your Timizer team (required for admin endpoints and webhooks)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'timizer-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.timizer.io',
			url: '=/app/admin-teams/{{$credentials.teamId}}/members',
			method: 'GET',
		},
	};
}
