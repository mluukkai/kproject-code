const NATS = require('nats')
const sc = NATS.StringCodec();

console.log('NATS url', process.env.NATS_URL)

const express = require('express');

const app = express();
const pg = require('pg');

const morgan = require('morgan');

const PORT = process.env.PORT || 3000;

const connectionString = process.env.DB_URL

const { Client } = pg
 
const client = new Client({
  connectionString
})

const getTodos = async () => {
  console.log('getting todos from db')
  const res = await client.query('SELECT * FROM todos')
  return res.rows
}

const isDbConnection = async () => {
  try {
    const result = await client.query('SELECT NOW()')
    return true
  } catch (e) {
    console.log('HEALTH DB FAILED TO CONNECT')
    return false
  }
}

const connectDb = async () => {
  console.log('connecting to database', connectionString)
  await client.connect()
  const result = await client.query('SELECT NOW()')
  console.log(result.rows)

  try {
    const todos = await getTodos()
    console.log(todos.length) 

  } catch (e) {
    const createTable = `
      CREATE TABLE todos ( \
        id SERIAL PRIMARY KEY, \
        title TEXT NOT NULL, \
        done BOOLEAN NOT NULL DEFAULT false \
      );
    `
    console.log('creating table', createTable)
    await client.query(createTable)
  }
}

connectDb()

const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

morgan.token('body', function (req, res) { return JSON.stringify(req.body) });

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.get('/', async (req, res) => {
  console.log('Getting /')
  res.json({ message: 'nothing here' });
});

app.get('/todos', async (req, res) => {
  console.log('Getting /todos')
  const todos = await getTodos()
  res.json(todos);
});

app.post('/todos', async (req, res) => {
  const title = req.body.todo;

  if (!title) {
    return res.status(400).json({ error: 'title must be defined' });
  }
  if (title.length > 140) {
    return res.status(400).json({ error: 'title can not exceed 140, was ' + title.length });
  }

  const insertTodoQuery = `
    INSERT INTO todos (title, done)
    VALUES ($1, $2)
    RETURNING id, title, done;
  `;
  try {
    const addedTodo = await client.query(insertTodoQuery, [title, false]);

    const nc = await NATS.connect(
      { servers: process.env.NATS_URL}
    )
    console.log(`connected to ${nc.getServer()}`);

    const payload = {
      title,
      status: 'created'
    }

    nc.publish("todo_info", sc.encode(JSON.stringify(payload)));

    await nc.drain();
    await nc.close();

    if (req.headers['content-type'] === 'application/json') {
      res.send(addedTodo);
    } else {
      res.redirect('/');
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while inserting the todo.' });
  }
});

let broken = false;

app.post('/todos/:id/done', async (req, res) => {
  const { id } = req.params;

  const updateTodoQuery = `
    UPDATE todos
    SET done = true
    WHERE id = $1
    RETURNING id, title, done;
  `;

  try {
    await client.query(updateTodoQuery, [id]);

    const nc = await NATS.connect(
      { servers: process.env.NATS_URL}
    )
    console.log(`connected to ${nc.getServer()}`);

    const res = await client.query('SELECT * FROM todos WHERE id = $1', [id]);
    const todo = res.rows[0];

    const payload = {
      title: todo.title,
      status: 'done'
    }

    console.log(payload)

    nc.publish("todo_info", sc.encode(JSON.stringify(payload)));

    await nc.drain();
    await nc.close();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

app.get('/healthz', async (req, res) => {
  if (broken) {
    return res.status(500).send('NOT OK');
  }

  const dbConnection = await isDbConnection()
  console.log('HEALTH has db', dbConnection)

  if (dbConnection) {
    res.send('OK');
  } else {
    broken = true;
    res.status(500).send('NOT OK');
  }
});

app.get('/fibo', async (req, res) => {
  const n = req.query.n ? Number(req.query.n) : 15;
  console.log('counting fibo for', n);
  const fib = (n) => {
    if (n < 2) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
  }
  
  const result = fib(n)
  
  console.log(result)
  res.send({ result });
})

app.get('/disq', async (req, res) => {
  await client.end()
  console.log('db client has disconnected')
  res.send('disconnected')
})

function gracefulShutdown() {
  console.log('Shutting down gracefully in 3 seconds...');
  broken = true;
  setTimeout(() => {
    console.log('Shutting down NOW...');
    process.exit(0);
  }, 3000);
}

process.on('SIGTERM', gracefulShutdown);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// sum(rate(container_cpu_usage_seconds_total{namespace="default"}[10m]))