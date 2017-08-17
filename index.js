const os = require('os');
const async = require('async');

const amqp = require('amqplib');
const config = require('./config/config');
const db = require('./app/models');
const Response = db.Response;
const Canvas = require('canvas');

const processingQueueName = process.env.PROCESSING_QUEUE_NAME || 'processingQueue';
const readingQueueName = process.env.READING_QUEUE_NAME || 'readingQueue';
const rabbitMQUrl = process.env.RABBITMQ_HOST || 'rabbitmq.localhost';

async function start() {
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
        result: getMandelbrot(body)
      });
      // console.log(`[x] Wrote response to DB with id ${response.id} - ${response.result}`);

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

async.retry({
    times: 10,
    interval: function(retryCount) {
      return 50 * Math.pow(2, retryCount);
    },
    errorFilter: function(err) {
      console.warn(err.errno === 'ECONNREFUSED' ? "Retry to connect" : "All connections are established");
      return err.errno === 'ECONNREFUSED'; // only retry on a specific error
    }
  },
  start);

/**
 * MANDELBROT algorithm
 */
function iterateMandelbrot(cx, cy, maxIter) {
  var i;
  var x = 0.0;
  var y = 0.0;
  for (i = 0; i < maxIter && x * x + y * y <= 4; ++i) {
    var tmp = 2 * x * y;
    x = x * x - y * y + cx;
    y = tmp + cy;
  }
  return i;
}

function getMandelbrot(body) {
  const data = JSON.parse(body);
  // console.log(data);

  var minX = data.x - data.scaleX,
    maxX = data.x + data.scaleX,
    minY = data.y - data.scaleY,
    maxY = data.y + data.scaleY;

  var canvas = new Canvas(data.width, data.height);
  var ctx = canvas.getContext("2d");
  var img = ctx.getImageData(0, 0, data.width, data.height);
  var pix = img.data;

  for (var ix = data.step; ix < data.step + data.stepX; ++ix) {
    for (var iy = 0; iy < data.height; ++iy) {
      var x = minX + (maxX - minX) * ix / (data.width - 1);
      var y = minY + (maxY - minY) * iy / (data.height - 1);
      var i = iterateMandelbrot(x, y, data.iter);

      var ppos = 4 * (data.width * iy + ix);
      if (i == data.iter) {
        pix[ppos] = 0;
        pix[ppos + 1] = 0;
        pix[ppos + 2] = 0;
      } else {
        var c = 3 * Math.log(i) / Math.log(data.iter - 1.0);
        if (c < 1) {
          pix[ppos] = 255 * c;
          pix[ppos + 1] = 0;
          pix[ppos + 2] = 0;
        } else if (c < 2) {
          pix[ppos] = 255;
          pix[ppos + 1] = 255 * (c - 1);
          pix[ppos + 2] = 0;
        } else {
          pix[ppos] = 255;
          pix[ppos + 1] = 255;
          pix[ppos + 2] = 255 * (c - 2);
        }
      }
      pix[ppos + 3] = 255;
    }
    // --------------- END WORKER
  }
  // --> (X + Image:base64) to DB
  ctx.putImageData(img, 0, 0);
  // return canvas.toDataURL();

  var canvasCropped = new Canvas(data.stepX, data.height);
  var ctxCropped = canvasCropped.getContext("2d");
  var imgCropped = ctx.getImageData(data.step, 0, data.step + data.stepX, data.height);
  ctxCropped.putImageData(imgCropped, 0, 0);
  return canvasCropped.toDataURL();
}
