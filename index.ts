import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import e from 'express'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

interface JWTPayload {
  username: string;
  password: string;
}

interface User {
  username: string
  password: string
  firstname: string
  lastname: string 
  balance: number
}

interface DbSchema {
  users: User[]
}

const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

app.post('/login',
  (req, res) => {
    const { username, password } = req.body
    const body = req.body
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  const user = db.users.find(user => user.username === body.username)
  if (!user) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  if (!bcrypt.compareSync(body.password, user.password)) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  const token = jwt.sign({ username: user.username, password: user.password }, SECRET)
  res.json({ token })
    return res.status(200).json({
      message: 'Login succesfully',
      token: token,
    })
  })

app.post('/register',
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400)
      res.json(errors)
      return
    }

    const { username, password, firstname, lastname, balance } = req.body
    const body = req.body
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  const hashPassword = bcrypt.hashSync(body.password, 10)

  try {
    res.status(200).json({
      message: 'Register succesfully',
    })
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      res.status(400)
      res.json({ message: `Username is already used` })
      return
    }

  db.users.push({
    username,
    password: hashPassword,
    firstname,
    lastname,
    balance: 100
  })
  
  fs.writeFileSync('db.json', JSON.stringify(db))
    return 
}
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
     
      const firstname = username[2]
      const lastname = username[3]
      const balance = username[4]

      res.status(200).json({
        name: { firstname, lastname },
        balance: balance,
      })
    }
    catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
       
    }
  })

app.post<any, any>('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty()){
      return res.status(400).json({ message: "Invalid data" })
    }
    
    const token = req.query.token as string
    const body = req.body
      try {
        var { username } = jwt.verify(token, SECRET) as JWTPayload
        var balance = username[username.length-1]

        res.status(200).json({
          message: "Deposit successfully",
          balance: Number(balance) + Number(body),
        })
      }
      catch (e) {
        res.status(401).json({
          message: "Invalid token"
        })
         
      }
  })

app.post('/withdraw',
  (req, res) => {
     //Is amount <= 0 ?
     if (!validationResult(req).isEmpty()){
      return res.status(400).json({ message: "Invalid data" })
    }

    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload

      var balance = Number(username[4])
      balance -= Number(req.body)
      if(balance > 0){
        res.status(200).json({
          message: "Withdraw successfully",
          balance: balance,
        })
      }
      else{
        res.status(400).json({
          message: "Invalid data",
        })
      }
    }
    catch (e) {
      res.status(401).json({
        message: "Invalid token"
      })
       
    }
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  db.users = []
  
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  res.status(200).json({
    firstname: "Peerawas",
    lastname: "Muanfoo",
    code: 620610803,
    gpa: 2.22,  // forget
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))