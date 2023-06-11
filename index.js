const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json());



// JWT Genarator

app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '24h' })

  res.send({ token })
})

// JWT varyfying
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];
  console.log("token",  token)
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    console.log("err", err)
    if (err) {
      return res.status(403).send({ error: true, message: 'unauthorized access' })
    }
    
    req.decoded = decoded;
    console.log("req.decoded", decoded);
    next();
  })
}





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.bqzilsj.mongodb.net/?retryWrites=true&w=majority`;

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

    const usersCollection = client.db('photofyDB2').collection('usersCollection')
    const classesCollection = client.db('photofyDB2').collection('classesCollection')
    const selectedClasses = client.db('photofyDB2').collection('selectedClasses')


    // Varifying Admin 

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

// Admin


app.get('/user/admin/:email', verifyJWT, async(req, res)=>{

  const email = req.params.email;

  if(email !== req.decoded.email){
    res.send({admin: false})
  }
  const query ={email: email};
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === 'admin' }
  res.send(result)

})



//  Users collection

    app.get('/users', verifyJWT, verifyAdmin, async(req, res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existedUser = await usersCollection.findOne(query);
      if (existedUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    // Instructor Collection

    app.get('/instructor', async (req, res) => {
      const query = { role: 'instructor' }
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })


    // selectedClasses collection

    app.delete('/selected-classes/:id', verifyJWT, async(req, res)=>{
      console.log(req.decoded.email)
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await selectedClasses.deleteOne(query);
      res.send(result)
    })

    app.get('/selected-classes/:email', async(req, res)=>{
      const {email} = req.params;
      const query = {email}
      const result = await selectedClasses.find(query).toArray()
      res.send(result)
    })

    app.post('/selected-classes', verifyJWT, async (req, res) => {
      const info = req.body;
      const result = await selectedClasses.insertOne(info)
      res.send(result)
    })

    // class collection

    app.get('/classes',  async (req, res) => {
      const query = {};
      const options = {
        // sort matched documents in descending order by rating
        sort: { "student": -1 },
      }

      const result = await classesCollection.find(query, options).toArray();
      res.send(result);

    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Photofy is running')
})

app.listen(port, () => {
  console.log(`Photofy is running on ${port}  `)
})


