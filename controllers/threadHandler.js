const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const url = process.env.DB;

function ThreadHandler() {

  this.threadList = (req, res)=> {
    const board = req.params.board;
    mongo.connect(url, (err,db)=> {
      const collection = db.collection(board);
      collection.find(
        {},
        {
          reported: 0,
          delete_password: 0,
          "replies.delete_password": 0,
          "replies.reported": 0
        })
      .sort({bumped_on: -1})
      .limit(10)
      .toArray((err,docs)=> {
        docs.forEach((doc)=> {
          doc.replycount = doc.replies.length;
          if(doc.replies.length > 3) { doc.replies = doc.replies.slice(-3); }
        });
        res.json(docs);
      });
    });
  };
  
  this.newThread = (req, res)=> {
    const board = req.params.board;
    var thread = {
      text: req.body.text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password,
      replies: []
    };
    mongo.connect(url, (err,db)=> {
      const collection = db.collection(board);
      collection.insert(thread, ()=> { res.redirect('/b/'+board+'/'); });
    });
  };
  
  //reported_id name
  this.reportThread = (req, res)=> {
    const board = req.params.board;
    mongo.connect(url, (err,db)=> {
      const collection = db.collection(board);
      collection.findAndModify(
        {_id: new ObjectId(req.body.report_id)},
        [],
        {$set: {reported: true}},
        (err, doc)=> {});
    });
    res.send('reported');
  };
  
  //check doc return to return right res
  this.deleteThread = (req, res)=> {
    const board = req.params.board;
    mongo.connect(url, (err,db)=> {
      const collection = db.collection(board);
      collection.findAndModify(
        {
          _id: new ObjectId(req.body.thread_id),
          delete_password: req.body.delete_password
        },
        [],
        {},
        {remove: true, new: false},
        (err, doc)=> { if (doc.value === null) { res.send('incorrect password'); } else { res.send('success'); } });
        
    });
  };
  
}

module.exports = ThreadHandler;