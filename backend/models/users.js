const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, default: null },
  lastName: { type: String, required: false, default: null },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, required: false },
});

const validate = (user) => {
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(30).required(),
  });
  return schema.validate(user);
};

module.exports = mongoose.model("user", userSchema);
