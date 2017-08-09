const os = require('os');
const amqp = require('amqplib');
const config = require('./config/config');
const db = require('./app/models');
const Response = db.Response;

const processingQueueName = process.env.PROCESSING_QUEUE_NAME;
const readingQueueName = process.env.READING_QUEUE_NAME;

db.sequelize.sync().then(() => {

  amqp.connect(`amqp://${process.env.RABBITMQ_HOST}`).then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });
    return conn.createChannel().then(function(ch) {
      ch.assertQueue(processingQueueName, {durable: true})
        .then(function() { ch.prefetch(1); })
        .then(function() {
          ch.consume(processingQueueName, doWork, {noAck: false});
          console.log(" [*] Waiting for messages. To exit press CTRL+C");
        });
      

      function doWork(msg) {
        let body = msg.content.toString();
        console.log(" [x] Received '%s'", body);

        Response.create({ container: os.hostname(), result: body}).then(response => {
          console.log(`[x] Wrote response to DB with id ${response.id}`);
          ch.ack(msg);
          ch.assertQueue(readingQueueName, {durable: true})
            .then(() => {
              ch.sendToQueue(readingQueueName, Buffer.from(response.id.toString()));
            });
        });
      }
    });
  }).catch(console.warn);

})

