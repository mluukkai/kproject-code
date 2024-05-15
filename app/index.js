const express = require('express');

const app = express();

let shell = require('shelljs');

const environment = process.env.ENV

const port = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const axios = require('axios');
const fs = require('fs');

app.set('view engine', 'ejs');

console.log('starting...');

async function downloadImage(url, filename) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filename, response.data);
}

app.use(express.static('pics'));

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  console.log('Getting index ', BACKEND_URL);
  const request = await axios.get(BACKEND_URL);
  const todos = request.data;
  console.log('got todos...', todos.length)
  res.render('index', { todos, environment });
});

app.get('/ping', (req, res) => {
  res.send('Pong!');
});

function calculateDateDifferenceInMinutes(date1, date2) {
  const diffInMilliseconds = Math.abs(date2 - date1);
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  return diffInMinutes;
}

const age = (FILE) => {
  try {
    const { birthtime } = fs.statSync(FILE);
    console.log(birthtime);
    return birthtime;
  } catch (err) {
    console.error(err);
  }
  return null
}

app.get('/picture.jpg', async (req, res) => {
  console.log('Getting image');
  const FILE = 'pics/image.jpg';

  const birthtime = age(FILE);

  const currentDate = new Date();
  const minutesDifference = !birthtime ? 10000 : calculateDateDifferenceInMinutes(birthtime, currentDate);

  console.log('Minutes difference:', minutesDifference);

  if (minutesDifference > 60) {
    console.log('Downloading new image');
    if (birthtime) { 
      console.log('Deleting old image');
      fs.unlinkSync(FILE);
    }
    await downloadImage('https://picsum.photos/1200', FILE);
  }

  res.sendFile(__dirname + '/' + FILE);
});

let broken = false;

app.get('/healthz', async (req, res) => {
  if (broken) {
    return res.status(500).send('NOT OK');
  }

  const skript = shell.exec('./health.sh')
  const code = skript.code
  const status = code === 0 ? 200 : 500
  console.log('skript check result:', code, 'status:', status)

  res.status(status).send({ data: code === 0 ? 'OK' : 'NOT OK'});
});

app.get('/health-live', async (req, res) => {
  console.log('HZ LIVE Checking health')
  if (broken) {
    console.log('HZ LIVE broken...')
    return res.status(500).send('NOT OK');
  }

  const skript = shell.exec('./health.sh')
  const code = skript.code
  const status = code === 0 ? 200 : 500
  console.log('HZ LIVE skript check result:', code, 'status:', status)

  res.status(status).send({ data: code === 0 ? 'OK' : 'NOT OK'});
});

function gracefulShutdown() {
  console.log('Shutting down gracefully in 3 seconds...');
  broken = true;
  setTimeout(() => {
    console.log('Shutting down NOW...');
    process.exit(0);
  }, 3000);
}

process.on('SIGTERM', gracefulShutdown);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});