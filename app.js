const express = require("express");
const path = require('path');
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');


const app = express();
//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set("view engine" , 'ejs');


//Mongo URI
const mongoURI = 'mongodb://localhost/gridfs';
// Create Mongo Connection
const conn = mongoose.createConnection(mongoURI);

//init gfs
let gfs;

conn.once('open', function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
 
})


// create torage engine

var storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const ogname = path.basename(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads',
            aliases : ogname
           
          };
          resolve(fileInfo);
        });
      });
    }
  });
const upload = multer({ storage });

// routes get / 
// loads form page
app.get("/" , (req,res) => {
    res.render("index");


});

// route post /upload
// upload file to db

app.post("/upload", upload.single('file') , (req,res) =>{
    //res.json({ file : req.file});
    res.redirect('/');
});
// route get all file in files
app.get('/file', (req,res) => {
    gfs.files.find().toArray((err,files) =>
    {
        if(!files || files.length ===0){
            return res.status(404).json({
                err:"no files"
            });
        }
        return res.json(files);
    });
});

// route get a perticular file :filename
app.get('/file/:filename', (req,res) => {
    gfs.files.findOne({filename : req.params.filename},(err,file) =>
    {
        if(!file || file.length ===0){
            return res.status(404).json({
                err:"no file like this.."
            });
        }
        return res.json(file);
    });
});


// route get AND DIsPLAY A sINGLE perticular file :filename 
app.get('/file-display/:filename', (req,res) => {
    gfs.files.findOne({filename : req.params.filename},(err,file) =>
    {
        if(!file || file.length ===0){
            return res.status(404).json({
                err:"no file like this.."
            });
        }
        var readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
    });
});


// route get AND DIsPLAY A sINGLE perticular file :filename in VIsUAL format
app.get('/file-gallery', (req,res) => {
    gfs.files.find().toArray((err,files) =>
    {
        if(!files || files.length ===0){
            return res.status(404).json({
                err:"no files"
            });
        }
        res.render("gallery", {arr : files})
    });
});
const port = 5000;


app.listen(port, () => console.log("server started on port " + port));