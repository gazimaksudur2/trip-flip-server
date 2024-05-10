const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:5173",
    "https://trip-flip.web.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
};

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

const verifyToken = (req, res, next)=>{
  const token = req?.cookies?.token;
  // console.log(req?.cookies);
  // console.log('token at verification',token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'});
  }
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err,decoded)=>{
    if(err){
      return res.status(401).send({message: "unauthorized access!!"});
    }
    req.user = decoded;
  })
  // console.log('cookie in the middleware : ',token);
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const hotelsDB = client.db("hotels");
    const demoColl = hotelsDB.collection("demoColl");
    const roomsColl = hotelsDB.collection("roomsColl");

    app.post('/jwt', async(req, res)=>{
        const user = req.body;
        console.log('user for token :',user);
        const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1h' })
        res.cookie('token', token, cookieOptions).send({token});
    });

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log("logged out user: ",user);
      res.clearCookie('token',{ maxAge: 0}).send({success: true});
    });


    app.get('/',(req, res)=>{
        res.send("Simple api Backend is running!!");
    });

    app.get('/hotels',(req, res)=>{
        res.send("Hotel info is preparing!!");
    });

    app.get('/demo', async(req, res)=>{
        const cursor = demoColl.find();
        // console.log(cursor);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/rooms', verifyToken, async(req, res)=>{
      const user = req.user;
      const queryUser = req.query;
      console.log('user :',user, " and query user: ", queryUser);
      if(user.email !== queryUser.email){
        return res.status(403).send({message: "forbidden access!!"});
      }
      const result = await roomsColl.find().toArray();
      res.send(result);
    });

    app.get('/rooms/:id', async(req, res)=>{

    });

    app.listen(port,()=>{
        console.log(`Simple backend is running on the port : ${port}`);
        // console.log(`now uri is : ${uri}`);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
