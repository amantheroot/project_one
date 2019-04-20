import React, { Component } from 'react';
import { connect } from "react-redux";

import ItemsBasket from "../subcomponents/itemsBasket";

const mapStateToProps = store => {
  return {
    products: store.products,
    cart: store.cart
  };
};

class toConnectCheckoutPage extends Component {
  appendZero = num => {
    return num < 10 ? `0${num}` : num;
  }

  formatDate = date => {
    return `${date.getFullYear()}-${this.appendZero(date.getMonth() + 1)}-${this.appendZero(date.getDate())} ${this.appendZero(date.getHours())}-${this.appendZero(date.getMinutes())}-${this.appendZero(date.getSeconds())}`;
  }

  handleOrderData = body => {
    let subtotal = 0;
    let orderList = '';
    body.cart.forEach((cartItem, id) => {
      const product = body.products.find(product => product.product_id === cartItem.product_id);
      subtotal += product.product_price;
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
      Total Charge: ${subtotal}/-
      Time (YYYY-MM-DD HH-MM-SS): ${body.orderTime}
    `;
    return bodyText;
  }

  sendEmailviaJS = order => {
    // SEND EMAIL
    console.log(order);
  }

  placeOrder = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customer = {
      name: formData.get('name'),
      address: formData.get('address'),
      phone: formData.get('phone'),
      email: formData.get('email')
    };
    const products = this.props.products.filter(product => this.props.cart.some(cartItem => cartItem.product_id === product.product_id));

    const orderDetails = {
      customer,
      cart: this.props.cart,
      products,
      orderTime: this.formatDate(new Date())
    };
    
    const order = this.handleOrderData(orderDetails);

    const apiOrder = fetch('/api/order', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({order})
    });

    apiOrder.then(res =>{
      if (!res.ok) {
        console.error(res.statusText);
        this.sendEmailviaJS(order);
      } else {
        window.location.href = "/thankyou"
      }
    });
  }

  render() {
    return (
      <div className="checkout">
        {this.props.cart.length > 0 ? 
          <React.Fragment>
            <h1>Checkout</h1>
            <h2>Order Summary</h2>
            <ItemsBasket />
            <h2>Customer Information</h2>
            <form onSubmit={this.placeOrder}>
              <label htmlFor="name">Name:</label>
              <input id="name" type="text" name="name" required />
              <label htmlFor="address">Location:</label>
              <textarea rows="4" id="address" type="text" name="address" required />
              <label htmlFor="phone">Phone:</label>
              <input id="phone" type="tel" pattern="[0-9]{10}" name="phone" required />
              <label htmlFor="email">Email:</label>
              <input id="email" type="email" name="email" />
              <div>
                <p>* At the moment payment via COD only is available.</p>
                <p>* At the moment delivery of products is only available on Saturdays</p>
              </div>
              <input type="submit" value="PLACE ORDER" />
            </form>
          </React.Fragment>
          :
          <p>The Basket Is Empty :(</p>}
      </div>
    );
  }
}

const CheckoutPage = connect(mapStateToProps)(toConnectCheckoutPage);

export default CheckoutPage;
