var express = require('express');
var router = express.Router();

//console.log("IT's WORKING!");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: BlankPage ' });
});

module.exports = router;
