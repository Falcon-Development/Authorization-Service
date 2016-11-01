var express = require('express');
var router = express.Router();
const config = require("configya")({
  file: "./config.json"
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', client_id: config.google.clientId });
});

module.exports = router;
