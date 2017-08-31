const os = require('os');
const amqp = require('amqplib');
const config = require('./config/config');
const db = require('./app/models');
const Response = db.Response;
const Mandelbrot = require('./app/mandelbrot');

const processingQueueName = process.env.PROCESSING_QUEUE_NAME || 'processingQueue';
const readingQueueName = process.env.READING_QUEUE_NAME || 'readingQueue';
const rabbitMQUrl = process.env.RABBITMQ_HOST || 'rabbitmq.localhost';

async function handleQueueConnection() {
  const connection = await amqp.connect(`amqp://` + rabbitMQUrl);
  console.log('worker - Connected to AMQP');
  process.once('SIGINT', () => {
    if (connection) {
      connection.close();
    }
  });

  connection.on('error', (error) => console.error(error));
  connection.on('close', () => {
    console.log('worker - Connection to AMQP closed. Retrying...');
    setTimeout(start, 1000);
  });

  return await connection.createChannel();
}

async function handleDatabaseConnection() {
  await db.sequelize.sync();
}

async function initQueues(channel) {
  await channel.prefetch(1);

  await channel.assertQueue(processingQueueName, {
    durable: true
  });
  
  await channel.assertQueue(readingQueueName, {
    durable: true
  });
}

async function start() {
  try {
    await handleDatabaseConnection();
    const channel = await handleQueueConnection();
    console.log('worker - AMQP channel created');
    await initQueues(channel);

    async function doWork(msg) {
      let body = msg.content.toString();
      console.log(`worker - [x] Received a new message to process: ${body}`);
    
      const data = JSON.parse(body);
      const response = await Response.create({
        container: os.hostname(),
        x: data.x,
        y: data.y,
        scaleX: data.scaleX,
        scaleY: data.scaleY,
        width: data.width,
        height: data.height,
        startX: data.startX,
        startY: data.startY,
        stepX: data.stepX,
        stepY: data.stepY,
        iter: data.iter,
        result: Mandelbrot.get(data),
        clientToken: data.clientToken
      });
      
      console.log(`worker - [x] Wrote response to DB with id ${response.id}`);
    
      channel.sendToQueue(readingQueueName, Buffer.from(response.id.toString()));
      channel.ack(msg);
    }

    channel.consume(processingQueueName, doWork, { noAck: false });
    console.log("worker - [*] Waiting for messages. To exit press CTRL+C");
  } catch (err) {
    console.error("worker - [ERROR] "+err.message);
    setTimeout(start, 1000);
  }
}

start();
