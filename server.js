const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const app = require('./app');
const connectToDatabase = require('./database/db');

const port = process.env.PORT || 3000;

connectToDatabase();
console.log("Nodemon reload test");

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
