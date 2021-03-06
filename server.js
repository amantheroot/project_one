const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// MYSQL
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : null,
  database : 'farma_one'
});

connection.connect(err => err? console.error(err):null);

app.get('/api/data', function(req, res) {
  const data = {};
  
  let query = 'SELECT * FROM products';
  connection.query(query, function(err,rows,fields) {
    if (err) throw err;
    
    data['products'] = rows;
  });

  query = 'SELECT * FROM suppliers';
  connection.query(query, function(err,rows,fields) {
    if (err) throw err;
    
    data['suppliers'] = rows;

    res.send(JSON.stringify(data));
  });
});

function checkNull(str) {
  if (str === '') {
    return 'NULL';
  }
  return `'${str}'`;
}

function orderValues(body) {
  const order_id = Math.round(Math.random()*100000);
  let string = '';
  body.cart.forEach(cartitem => {
    string += `(@custkey, ${cartitem.product_id}, ${cartitem.product_qty}, '${body.orderTime}', ${order_id}) `;
  });
  return string;
}

function insertDataIntoDB(body) {
  let query = `INSERT INTO customers (customer_name, customer_address, customer_phone, customer_email) VALUES ('${body.customer.name}', '${body.customer.address}', '${body.customer.phone}', ${checkNull(body.customer.email)})`;
  connection.query(query, function(err, rows, fields) {
    if (err) throw err;
  });

  query = 'SET @custkey = LAST_INSERT_ID()';
  connection.query(query, function(err, rows, fields) {
    if (err) throw err;
  });

  query = `INSERT INTO orders(customer_id, product_id, product_qty_sold, order_time, order_id) VALUES ${orderValues(body)}`;
  connection.query(query, function(err, rows, fields) {
    if (err) throw err;
    console.log('SUCCESSFULLY ADDED DATA!');
  });

}

function handleOrderData(body) {
  let orderList = '';
  body.cart.forEach((cartItem, id) => {
    const product = body.products.find(product => product.product_id === cartItem.product_id);
    orderList += `
    Product No.${id+1} => 
      Name: ${product.product_name}
      Price: ${product.product_price}/-
      Quantity (kg): ${cartItem.product_qty}
    `;
  })
  const bodyText = `
  🎉 ORDER PLACED: 🎉

  Customer Information 🙆🏽‍:
    Name: ${body.customer.name}
    Address: ${body.customer.address}
    Phone: ${body.customer.phone}
    Email: ${body.customer.email !== '' ? body.customer.email : 'NA'}
  
  Order Information 🎁:
    PRODUCTS: ${orderList}
    Total Charge: ${body.subtotal}/-
    Time (YYYY-MM-DD HH-MM-SS): ${body.orderTime}
  `;
  return bodyText;
}

app.post('/api/order', function(req, res) {
  const emailText = handleOrderData(req.body);

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'usernameisabhi@gmail.com',
      pass: 'photron2'
    }
  });

  const mailOptions = {
    from: 'usernameisabhi@gmail.com',
    to: 'farmaonein@gmail.com',
    subject: 'Order Placed! YAY!',
    text: emailText
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.end();
      insertDataIntoDB(req.body);
    }
  });
});

app.post('/api/contactform', function(req, res) {
  const emailText = `
    🎉 CONTACT FROM SUBMITTED: 🎉

      Name: ${req.body.name}

      Email: ${req.body.email}

      Phone: ${req.body.phone}

      Subject: ${req.body.subject}

      Message: ${req.body.message}
  `;

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'usernameisabhi@gmail.com',
      pass: 'photron2'
    }
  });

  const mailOptions = {
    from: 'usernameisabhi@gmail.com',
    to: 'farmaonein@gmail.com',
    subject: 'Contact Form Submitted! YAY!',
    text: emailText
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.end();
      insertDataIntoDB(req.body);
    }
  });
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
