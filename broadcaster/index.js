const { Webhook } = require('discord-webhook-node');
const NATS = require('nats')
const sc = NATS.StringCodec();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const webhook_url = process.env.DISCORD_WEBHOOK;
console.log('webhook', webhook_url);
const hook = new Webhook(webhook_url);
hook.setUsername('devopswithkubernetes.com');
const IMAGE_URL = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
hook.setAvatar(IMAGE_URL); 

app.get('/', async (req, res) => {
  res.send('Hello World!')
})

app.get('/chat', async (req, res) => { 
  hook.send("Hello there!");
  res.send('sent message to discord!')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('Saver listening')

const main = async () => {
  console.log('using', process.env.NATS_URL)
  const nc = await NATS.connect(
    { servers: process.env.NATS_URL}
  )
  
  console.log(`connected to ${nc.getServer()}`);

  const subscription = nc.subscribe("todo_info", { queue: "broadcaster" });
  
  for await (const m of subscription) {
    const obj = JSON.parse(sc.decode(m.data))
    console.log(obj)

    console.log(`${obj.status} todo '${obj.title}'`)

    hook.send(`${obj.status} todo '${obj.title}'`)
  }
}

main()