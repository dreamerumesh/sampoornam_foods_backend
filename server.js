const app = require('./app');
const config = require('./config/default');

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



