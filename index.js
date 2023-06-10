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
  const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' })

  res.send({ token })
})

// JWT varyfying
  const verifyJWT = (req, res, next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
      if(err){
        return res.status(401).send({error: true, message: 'unauthorized access'})
      }
      req.decoded = decoded;
      next();
    })
  }



const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.get('/instructor', async(req, res)=>{
      const query = {role : 'instructor'}
      const result = await  usersCollection.find(query).toArray()
      res.send(result)
    })


    // selectedClasses collection

    app.post('/selected-classes', verifyJWT,  async (req, res) =>{
      const info = req.body;
      const result = await selectedClasses.insertOne(info)
      res.send(result)
    })

    // class collection

    app.get('/classes', async (req, res) => {
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


