let express = require("express");
const paginate = require('express-paginate');
let cors = require('cors');
let app = express(),
    mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient, //is used to connect to mongoDB
    mongoDSN = 'mongodb://localhost:27017/admin',
    limit, page; //global variables
   
app.use(paginate.middleware(10, 5000000)); //pagination with limits
app.use(cors());

//create an api with get request with page and limit params
app.get("/records", async (request, response) => {
    MongoClient.connect(mongoDSN,async function(error, db) {
        try {
            if (error) {
                throw new Error(error);
            }
            //set page number and limit
            const pageOptions = {
                page: parseInt(request.query.page, 10) || 1,
                limit: parseInt(request.query.limit, 10) || 10
            }

            const count = await db.collection("RECORDS").count(); //will count records
            //find specific records according to API GET request
            const records = await db.collection("RECORDS")
                                    .find()
                                    .skip((pageOptions.page-1)  * pageOptions.limit)
                                    .limit(pageOptions.limit).toArray();

            return response.json({"RECORDS": records, "TotalCount": count, "Page": pageOptions.page, "Limit": pageOptions.limit});
        } catch(err) {
            res.sendStatus(500);
        } finally {
            db.close();
        }
    });
});

//create an api to get specific record with id
app.get('/records/:id', (request, response) => {

    MongoClient.connect(mongoDSN, async function(error, db) {
        try {
            const id = request.params.id; //get ud from api params
            const record = await db.collection("RECORDS").find({ id: id }).toArray();
            if(record.length === 1) {
                response.json({ "RECORD": record[0] });
            } else {
                console.log(`ERROR: Multiple or No record found for Id ${id}: ${record}`)
                response.send(500);
            }
        } catch(error) {
            response.status(500);
        } finally {
            db.close();
        }
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

