# n8n-nodes-timizer

This is an [n8n](https://n8n.io/) community node for [Timizer](https://timizer.io), a timesheet and activity report management platform.

It lets you interact with the Timizer API directly from your n8n workflows.

## Installation

In your n8n instance:

1. Go to **Settings > Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-timizer`
4. Click **Install**

## Credentials

You need a Timizer API key and Team ID to authenticate. Configure them in n8n:

1. Go to **Credentials > New Credential**
2. Search for **Timizer API**
3. Enter your **API Key** and **Team ID**

## Nodes

### Timizer

Interact with Timizer resources. Supported resources and operations:

| Resource | Operations |
|---|---|
| Activity Report | Create, Delete, Get, Update |
| Client | Create, Delete, Get, Update |
| Client Contact | Create, Delete, Update |
| Contracted | Create, Delete, Get, Update |
| Contracted Contact | Create, Delete, Update |
| Mission | Create, Delete, Update |
| Tag | Create, Delete, Update |
| Team | Create, Delete, Update |
| Team Member | Delete, Update |

### Timizer Trigger

Starts a workflow when Timizer events occur via webhooks. Supported events:

- Activity Report: Created, Deleted, Refused, Shared, Signed, Updated

## Compatibility

Tested with n8n v1.x. Requires Node.js >= 18.

## Resources

- [Timizer website](https://timizer.io)
- [Timizer API documentation](https://api.timizer.io)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
