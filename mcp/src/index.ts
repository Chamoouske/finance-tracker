import { ApiClient } from './api-client.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? '3001');
const api = new ApiClient(process.env.GO_API_URL ?? 'http://localhost:8080');
const app = createApp(api);

app.listen(port, '0.0.0.0', () => {
  console.log(`Finance Tracker MCP listening on port ${port}`);
});
