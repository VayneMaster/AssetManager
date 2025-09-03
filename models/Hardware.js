const mongoose = require('mongoose');

const hardwareSchema = new mongoose.Schema({
  name: String,
  location: String,
  user: String,
  serialnumber: Number,
  quantity: Number,
  imagePath: String
});

module.exports = mongoose.model('Hardware', hardwareSchema);
