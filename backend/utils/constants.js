module.exports = {
  database: {
    options: {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // maxPoolSize: 10,
      // bufferCommands: false,
    },
  },
  user: {
    roles: ["Admin", "User", "Operator"],
  },
  roles: {
    admin: "Admin",
    user: "User",
    operator: "Operator",
  },
};
