import serverless from 'serverless-http';

// Import app directly - this should now be fast since we removed blocking code
import { app } from '../src/app';

// Export serverless handler
export default serverless(app, {
  request: (_request: any, _event: any, context: any) => {
    context.callbackWaitsForEmptyEventLoop = false;
  }
});
