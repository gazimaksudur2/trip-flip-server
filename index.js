const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
  secure: process.env.NODE_ENV === "production" ? false : true,
  sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
};

// const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.oknyghy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// local mongoDB
const uri = 'mongodb://localhost:27017';

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
    const bookingColl = hotelsDB.collection("bookingColl");
    const carouselInfo = hotelsDB.collection("carouselInfo");
    const reviewsColl = hotelsDB.collection("reviewsColl");

    app.post('/jwt', async(req, res)=>{
        const user = req.body;
        // console.log('user for token :',user);
        const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1h' })
        res.cookie('token', token, cookieOptions).send({token});
    });

    app.post('/logout', async(req, res)=>{
      // const user = req.body;
      // console.log("logged out user: ",user);
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


    app.get('/bookings', async(req, res)=>{
        const cursor = bookingColl.find();
        // console.log(cursor);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.post('/bookings', async(req, res)=>{
      const doc = req.body;
      const result = await bookingColl.insertOne(doc);
      // console.log(doc);
      res.send(result);
    })

    app.get('/reviews', async(req, res)=>{
        const cursor = reviewsColl.find();
        // console.log(cursor);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/reviews/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {
          roomId: id
        }
        console.log(query);
        const cursor = reviewsColl.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.post('/reviews', async(req, res)=>{
      const doc = req.body;
      // console.log(doc);
      const result = await reviewsColl.insertOne(doc);
      res.send(result);
    })

    app.get('/carousel', async(req, res)=>{
        const cursor = carouselInfo.find();
        // console.log(cursor);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/rooms', async(req, res)=>{
      // const user = req.user;
      const queryUser = req.query;
      let result;
      const options = {
        sort: {
          id: -1
        },
        projection: {
          room_title: 1, room_description: 1, reviews: 1, customer_ratings: 1 , card_img: 1 
        }
      }
      if(queryUser?.start === undefined){
        // console.log("query user: ", queryUser);
        result = await roomsColl.find({},options).toArray();
      }else{
        const start = queryUser.start;
        const end = queryUser.end;
        // console.log(start, end);
        if(end === 'all'){
          const filter = {price_per_night:{$gt: parseInt(start)}};
          result = await roomsColl.find(filter,options).toArray();
        }else{
          // console.log('in range');
          const filter = { price_per_night:{$gt: parseInt(start), $lt: parseInt(end)} };
          result = await roomsColl.find(filter, options).toArray();
        }
      }
      // console.log(cursor)
      // if(user.email !== queryUser.email){
      //   return res.status(403).send({message: "forbidden access!!"});
      // }
      res.send(result);
    });

    app.get('/rooms/:id', async(req, res)=>{
      // const user = req.user;
      // const queryUser = req.query;
      // console.log('user :',user, " and query user: ", queryUser);
      // if(user.email !== queryUser.email){
      //   return res.status(403).send({message: "forbidden access!!"});
      // }
      const options = {
        projection: {
          room_title: 1, room_description: 1, reviews: 1, customer_ratings: 1 , homeImg: 1, room_size: 1, price_per_night: 1, availability: 1, facilities: 1, room_images: 1, reviews: 1, special_offers: 1, features: 1
        }
      }
      const room_id = req.params.id;
      const query = { _id : new ObjectId(room_id) }
      const result = await roomsColl.findOne(query,options);
      res.send(result);
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
