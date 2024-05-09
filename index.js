const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const port = process.env.PORT || 5000;

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.oknyghy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// local mongoDB
// const uri = 'mongodb://localhost:27017';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });


    app.get('/',(req, res)=>{
        res.send("Simple api Backend is running!!");
    });

    app.get('/hotels',(req, res)=>{
        res.send("Hotel info is preparing!!");
    });

    app.listen(port,()=>{
        console.log(`Simple backend is running on the port : ${port}`);
        // console.log(`now uri is : ${uri}`);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
