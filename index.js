const os = require('os');
const amqp = require('amqplib');
const config = require('./config/config');
const db = require('./app/models');
const Response = db.Response;

const processingQueueName = process.env.PROCESSING_QUEUE_NAME || 'processingQueue';
const readingQueueName = process.env.READING_QUEUE_NAME || 'readingQueue';
const rabbitMQUrl = process.env.RABBITMQ_HOST || 'rabbitmq.localhost';

async function main() {
  try {
    await db.sequelize.sync();

    const connection = await amqp.connect(`amqp://` + rabbitMQUrl);

    process.once('SIGINT', () => connection.close());

    const channel = await connection.createChannel();
    await channel.assertQueue(processingQueueName, {
      durable: true
    });
    await channel.prefetch(1);
    channel.consume(processingQueueName, doWork, {
      noAck: false
    });
    console.log(" [*] Waiting for messages. To exit press CTRL+C");

    async function doWork(msg) {
      let body = msg.content.toString();
      console.log(" [x] Received '%s'", body);

      const response = await Response.create({
        container: os.hostname(),
        result: body
      });
      console.log(`[x] Wrote response to DB with id ${response.id}`);
      await channel.assertQueue(readingQueueName, {
        durable: true
      });
      channel.sendToQueue(readingQueueName, Buffer.from(response.id.toString()));
      channel.ack(msg);
    }

  } catch (e) {
    console.warn(e);
  }
}

main();
