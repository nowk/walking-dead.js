/* jshint node: true */

var express = require('express');

/*
 * express app (expose)
 */

var app = module.exports = express();

app.get("/", function(req, res, next) {
  var html = "<html>" +
    "<head><title>Walking Dead</title></head>" +
    "<body>" +
    "  <h1>Hello World!</h1>" +
    "  <p><a href='/linky'>Linky</p>" +
    "</body>" +
    "</html>";
  res.send(html);
});

app.get("/linky", function(req, res, next) {
  var html = "<html>" +
    "<head><title>Walking Dead - Linky</title></head>" +
    "<body>" +
    "  <h1>Linky!</h1>" +
    "  <p><a href='/'>Home</p>" +
    "</body>" +
    "</html>";
  res.send(html);
});

