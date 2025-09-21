
require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Expense Tracker backend listening on port ${PORT}`);
  console.log('Run migrations with: npm run migrate');
});
