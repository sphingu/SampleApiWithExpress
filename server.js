var express = require('express');
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectId = mongodb.ObjectId;

var LINK_COLLECTION = 'links';

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.use(cors());

var db;
process.env.MONGODB_URL = "mongodb://localhost:27017/databaseName";

mongodb.MongoClient.connect(process.env.MONGODB_URL, function (err, database) {
  if (err) {
    console.log(err);
    process.exist(1);
  }
  db = database;
  console.log('Database connection ready');

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log('App now running on port ' + port);
  });
});

// LINKS API ROUTES
function handleError(res, reason, message, code) {
  console.log('ERROR : ' + reason);
  res.statusMessage = message;
  res.status(code || 500).end();
  //res.send('Error : ' + message);
}

app.use(function (req, res, next) {
  // res.header("Access-Control-Allow-Methods","DELETE");
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/links", function (req, res) {
  console.log(req.query.pageIndex);
  const pageIndex = req.query.pageIndex || 0;
  const pageSize = req.query.pageSize || 10;
  db.collection(LINK_COLLECTION).find({}).skip(pageIndex * pageSize).limit(pageSize).toArray(function (err, docs) {
    if (err) {
      handleError(req, err.message, "Failed to get links");
    } else {
      db.collection(LINK_COLLECTION).count(function (error, count) {
        res.status(200).json({ data: docs, total: count });
      });
    }
  });
});

app.post("/links", function (req, res) {
  var newLink = req.body;
  console.log(req.body);
  newLink.createdOn = new Date();

  if (!(req.body.title && req.body.body)) {
    return handleError(res, "Invalid user input", "Must provide link title and body", 400);
  }

  db.collection(LINK_COLLECTION).insertOne(newLink, function (err, doc) {
    if (err) {
      handleError(req, err.message, "Failed to create new Link");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.get('/links/:id', function (req, res) {
  db.collection(LINK_COLLECTION).findOne({ _id: new ObjectId(req.params.id) }, function (err, doc) {
    if (err) {
      handleError(req, err.message, "Failed to get link");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put('/links/:id', function (req, res) {
  var updatedDoc = req.body;
  delete updatedDoc._id;
  db.collection(LINK_COLLECTION).updateOne({ _id: new ObjectId(req.params.id) }, updatedDoc, function (err, doc) {
    if (err) {
      handleError(req, err.message, "Failed to update link");
    } else {
      res.status(204).end();
    }
  });
});

app.delete('/links/:id', function (req, res) {
  db.collection(LINK_COLLECTION).deleteOne({ _id: new ObjectId(req.params.id) }, function (err, doc) {
    if (err) {
      handleError(req, err.message, "Failed to delete link");
    } else {
      res.status(204).end();
    }
  });
});
