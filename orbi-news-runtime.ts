import dotenv from 'dotenv';
import { createOrbiNewsRuntimeApp } from './server/operations/runtime-service-app';

dotenv.config();

const port = Number(process.env.PORT) || 8080;
const app = createOrbiNewsRuntimeApp(process.env);
app.listen(port, '0.0.0.0', () => {
  console.log(`ORBI News runtime listening on port ${port}`);
});
