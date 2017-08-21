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

async function handleQueueConnection() {
  // try {
  const connection = await amqp.connect(`amqp://` + rabbitMQUrl);
  process.once('SIGINT', () => connection.close());
  const channel = await connection.createChannel();
  if (channel)
    return channel;
  else
    throw new Error("Channel is undefined");
  // } catch (err) {
  //   console.warn(err);
  //   setTimeout(handleQueueConnection, 1000);
  // }
}

async function handleDatabaseConnection() {
  // try {
  await db.sequelize.sync();
  // } catch (err) {
  //   console.warn(err);
  //   setTimeout(handleDatabaseConnection, 1000);
  // }
}

async function start() {
  try {
    const promise = await handleDatabaseConnection();
    const channel = await handleQueueConnection();
    startWorker(channel);
  } catch (err) {
    console.warn("[ERROR] "+err.message);
    setTimeout(start, 1000);
  }
}

async function startWorker(channel) {
  try {
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

      const data = JSON.parse(body);
      const response = await Response.create({
        container: os.hostname(),
        x: data.x,
        y: data.y,
        scaleX: data.scaleX,
        scaleY: data.scaleY,
        width: data.width,
        height: data.height,
        step: data.step,
        stepX: data.stepX,
        stepY: data.stepY,
        iter: data.iter,
        result: getMandelbrot(data)
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
  let i,
    x = 0.0,
    y = 0.0;

  for (i = 0; i < maxIter && x * x + y * y <= 4; ++i) {
    var tmp = 2 * x * y;
    x = x * x - y * y + cx;
    y = tmp + cy;
  }
  return i;
}

function fixColorByPoint(ppos, pix, i, iter) {
  if (i == iter) {
    pix[ppos] = 0;
    pix[ppos + 1] = 0;
    pix[ppos + 2] = 0;
  } else {
    var c = 3 * Math.log(i) / Math.log(iter - 1.0);
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

function getMandelbrot(data) {
  let minX = data.x - data.scaleX,
    maxX = data.x + data.scaleX,
    minY = data.y - data.scaleY,
    maxY = data.y + data.scaleY;

  let canvas = new Canvas(data.width, data.height),
    canvasCropped = new Canvas(data.stepX, data.height);;
  let ctx = canvas.getContext("2d"),
    ctxCropped = canvasCropped.getContext("2d");
  let img = ctx.getImageData(0, 0, data.width, data.height);
  let pix = img.data;

  for (var ix = data.step; ix < data.step + data.stepX; ++ix) {
    for (var iy = 0; iy < data.height; ++iy) {
      let x = minX + (maxX - minX) * ix / (data.width - 1);
      let y = minY + (maxY - minY) * iy / (data.height - 1);
      let ppos = 4 * (data.width * iy + ix);
      fixColorByPoint(
        ppos,
        pix,
        iterateMandelbrot(x, y, data.iter),
        data.iter);
    }
  }
  ctx.putImageData(img, 0, 0);
  let imgCropped = ctx.getImageData(data.step, 0, data.step + data.stepX, data.height);
  ctxCropped.putImageData(imgCropped, 0, 0);
  return canvasCropped.toDataURL();
}
