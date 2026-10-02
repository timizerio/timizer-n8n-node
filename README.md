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

## Usage Example

### Create an activity report

This walks through creating a monthly activity report (CRA) with the **Timizer** node.

1. Add a **Timizer** node to your workflow and select the Timizer API credential you configured above.
2. Set **Resource** to `Activity Report`.
3. Set **Operation** to `Create`.
4. Fill in the required fields:
   - **Client ID** – numeric ID of the client, e.g. `123`
   - **Contracted ID** – numeric ID of the contracted company, e.g. `45`
   - **Month** – e.g. `1` for January
   - **Year** – e.g. `2026`
   - **Work Days** – click **Add Work Day** once per day worked, e.g.:
     - Day of Month `1`, Worked Time `Full`
     - Day of Month `2`, Worked Time `Half`
     - Day of Month `3`, Worked Time `Custom`, Worked Seconds `14400`
5. Optionally expand **Additional Fields** to set a Mission ID, Client Contact ID, Note, etc.
6. Execute the node.

**Expected output**

The node returns the created activity report as JSON, for example:

```json
{
  "id": 789,
  "clientId": 123,
  "contractedId": 45,
  "month": 1,
  "year": 2026,
  "workDays": [
    { "dayOfMonth": 1, "workedTime": "full" },
    { "dayOfMonth": 2, "workedTime": "half" },
    { "dayOfMonth": 3, "workedTime": "custom", "workedSeconds": 14400 }
  ]
}
```

Use the returned `id` as the **Activity Report ID** in a following Timizer node to, for example, **Share** or **Share by Email** the report you just created.

## Compatibility

Tested with n8n v1.x. Requires Node.js >= 18.

## Resources

- [Timizer website](https://timizer.io)
- [Timizer API documentation](https://api.timizer.io)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
