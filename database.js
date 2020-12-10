
let glob = require('glob'),
mongodb = require('mongodb'),
fs = require('fs'),
MongoClient = mongodb.MongoClient,
mongoDSN = 'mongodb://localhost:27017/admin',
collection; //  initiate variables in "global" scope so we can do it only once

function insertRecord(records, done) {
    if(records.length > 0) {
        return collection.insertMany(records, done); //insertMany will insert all records in one go
    }

    done('There is no record to add');
}

function runOnFile(file, done) {
//  moved to be async
    fs.readFile(file, 'utf8', function(error, data) { //read json file and extract data
        if (error) {
            return done(error);
    }

    //convert json string to data
    let records = JSON.parse(data)["RECORDS"];
    records.forEach(record => {
        // record['_id'] = record['id']; //we can replace auto generated mongoDB '_id' with our own 'id'
        // delete record['id'];
        record.meta = JSON.parse(record.meta);
    });

    if (!records) {
        return done('Unable to parse JSON: ' + file);
    }

    insertRecord(records, done); //insert records in collection
});
}

function processFiles(files, done) {

    var next = files.length ? files.shift() : null;

    if (next) {
        return runOnFile(next, function(error) {
            if (error) {
                console.error(error);
            }

            processFiles(files, done);
        });
    }

    done();
}

//if SEED_DATA is false, that means inial database is already created following 'Seeding Database' pattern
const { SEED_DATA } = process.env;
const seedData = SEED_DATA === 'true';

MongoClient.connect(mongoDSN, function(error, db) { //connect to mongoDB database
if (error) {
    throw new Error(error);
}

if(seedData) {
       
    db.listCollections().toArray(function(err, items){ //get all collections from mongoDB
        if (err) throw err;
    
        if(items.find(i => i.name == 'RECORDS')){ //check if 'RECORDS' db exist in collection items
            console.log("Collection is already in database!")  
        } else {
            db.createCollection("RECORDS", (err, result) => { //if 'RECORDS' db doesn't exist, it'll create new collection
                if (err) throw err;
                console.log("Collection is created!");
            });        
        }
    }); 

    collection = db.collection('RECORDS');  //get a collection named 'RECORDS'

    //glob() will fetch file and return it in callback function
    glob('./audit.json', function(error, files) {
        if (error) {
            throw new Error(error);
        }

        processFiles(files, function() {
            console.log('all done');
            db.close();
        });
    });
} else {
    console.log(`SEED Data is disabled.`)
    db.close();
}
});