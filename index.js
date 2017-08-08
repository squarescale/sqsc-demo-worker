const amqp = require('amqplib');

const queueName = process.env.QUEUE_NAME;

amqp.connect(`amqp://${process.env.RABBITMQ_HOST}`).then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue(queueName, {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume(queueName, function(msg) {
        console.log(" [x] Received '%s'", msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
    });
  });
}).catch(console.warn);