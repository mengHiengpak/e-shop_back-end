const dotenv = require('dotenv');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Render injects real environment variables, and dotenv never overwrites an
// already-set key. This file is only a fallback for when the dashboard has no
// values, so the right one has to be picked by environment: config.env points
// at a local mongod and SameSite=lax, both of which break a deployed host.
const envFile = isProduction ? 'pro.env' : 'config.env';
dotenv.config({ path: path.join(__dirname, envFile) });

// The dashboard and storefront are separate onrender.com hosts, so the auth
// cookie is cross-site. Browsers silently drop a SameSite=lax cookie in that
// setup, which signs the user in and then 401s every later request.
if (isProduction) {
  process.env.COOKIE_SAMESITE = 'none';
  process.env.COOKIE_SAMESITEONE = 'none';
}

const app = require('./app');
const connectToDatabase = require('./database/db');

const port = process.env.PORT || 3000;

if (isProduction && !process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it in the Render dashboard under Environment.');
  process.exit(1);
}

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port} (${isProduction ? 'production' : 'development'})`);
    });
  })
  .catch((error) => {
    console.error('Failed to start: database is unreachable.', error.message);
    process.exit(1);
  });
