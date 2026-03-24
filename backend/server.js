const app = require("./src/app");
const setupDatabase = require("./src/config/setupDb");

const PORT = process.env.PORT || 3001;

setupDatabase();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});