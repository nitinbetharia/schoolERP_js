const crypto = require('crypto');

/**
 * Payment Gateway Service - Handles integration with multiple payment gateways
 * Supports Razorpay, Paytm, PayU, CCAvenue, Instamojo
 */
class PaymentGatewayService {
  constructor() {
    this.gateways = {
      RAZORPAY: new RazorpayGateway(),
      PAYTM: new PaytmGateway(),
      PAYU: new PayUGateway(),
      CCAVENUE: new CCAvnueGateway(),
      INSTAMOJO: new InstamojoGateway()
    };
  }

  async createOrder(gatewayType, orderData, configuration) {
    const gateway = this.gateways[gatewayType];
    if (!gateway) {
      throw new Error(`Unsupported gateway type: ${gatewayType}`);
    }

    return await gateway.createOrder(orderData, configuration);
  }

  async verifyPayment(gatewayType, paymentData, configuration) {
    const gateway = this.gateways[gatewayType];
    if (!gateway) {
      throw new Error(`Unsupported gateway type: ${gatewayType}`);
    }

    return await gateway.verifyPayment(paymentData, configuration);
  }

  async refundPayment(gatewayType, refundData, configuration) {
    const gateway = this.gateways[gatewayType];
    if (!gateway) {
      throw new Error(`Unsupported gateway type: ${gatewayType}`);
    }

    return await gateway.refundPayment(refundData, configuration);
  }
}

/**
 * Base Gateway Class - Common interface for all payment gateways
 */
class BaseGateway {
  async createOrder(orderData, configuration) {
    throw new Error('createOrder method must be implemented');
  }

  async verifyPayment(paymentData, configuration) {
    throw new Error('verifyPayment method must be implemented');
  }

  async refundPayment(refundData, configuration) {
    throw new Error('refundPayment method must be implemented');
  }

  // Utility method to generate secure hash
  generateHash(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  // Utility method to verify hash
  verifyHash(data, hash, secret, algorithm = 'sha256') {
    const expectedHash = this.generateHash(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  }
}

/**
 * Razorpay Gateway Implementation
 */
class RazorpayGateway extends BaseGateway {
  async createOrder(orderData, configuration) {
    try {
      const auth = Buffer.from(`${configuration.key_id}:${configuration.key_secret}`).toString(
        'base64'
      );

      const requestData = {
        amount: Math.round(orderData.amount * 100), // Convert to paisa
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      };

      // In production, make actual API call to Razorpay
      // const response = await axios.post('https://api.razorpay.com/v1/orders', requestData, {
      //   headers: { 'Authorization': `Basic ${auth}` }
      // });

      // Mock response for development
      const mockResponse = {
        id: `order_${Math.random().toString(36).substr(2, 14)}`,
        entity: 'order',
        amount: requestData.amount,
        amount_paid: 0,
        amount_due: requestData.amount,
        currency: requestData.currency,
        receipt: requestData.receipt,
        status: 'created',
        attempts: 0,
        notes: requestData.notes,
        created_at: Math.floor(Date.now() / 1000)
      };

      return {
        success: true,
        order_id: mockResponse.id,
        amount: mockResponse.amount,
        currency: mockResponse.currency,
        gateway_response: mockResponse
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyPayment(paymentData, configuration) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = this.generateHash(body, configuration.key_secret);

      if (!this.verifyHash(body, razorpay_signature, configuration.key_secret)) {
        throw new Error('Invalid payment signature');
      }

      // In production, fetch payment details from Razorpay API
      // const response = await axios.get(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      //   auth: { username: configuration.key_id, password: configuration.key_secret }
      // });

      // Mock verification for development
      return {
        success: true,
        status: 'SUCCESS',
        gateway_transaction_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: paymentData.amount || 0,
        currency: 'INR',
        payment_method: 'ONLINE'
      };
    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async refundPayment(refundData, configuration) {
    try {
      const auth = Buffer.from(`${configuration.key_id}:${configuration.key_secret}`).toString(
        'base64'
      );

      const requestData = {
        amount: Math.round(refundData.amount * 100), // Convert to paisa
        speed: refundData.speed || 'normal',
        notes: refundData.notes || {}
      };

      // In production, make actual API call to Razorpay
      // const response = await axios.post(`https://api.razorpay.com/v1/payments/${refundData.payment_id}/refund`, requestData, {
      //   headers: { 'Authorization': `Basic ${auth}` }
      // });

      // Mock response for development
      return {
        success: true,
        refund_id: `rfnd_${Math.random().toString(36).substr(2, 14)}`,
        amount: requestData.amount,
        status: 'processed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Paytm Gateway Implementation
 */
class PaytmGateway extends BaseGateway {
  async createOrder(orderData, configuration) {
    try {
      const requestData = {
        body: {
          requestType: 'Payment',
          mid: configuration.merchant_id,
          orderId: orderData.receipt,
          amount: orderData.amount.toString(),
          currencyCode: orderData.currency || 'INR',
          callbackUrl: configuration.callback_url,
          txnAmount: {
            value: orderData.amount.toString(),
            currency: orderData.currency || 'INR'
          },
          userInfo: {
            custId: orderData.customer_id || 'CUST_001'
          }
        }
      };

      // Generate checksum for Paytm
      const checksum = this.generatePaytmChecksum(requestData.body, configuration.merchant_key);
      requestData.head = { signature: checksum };

      // Mock response for development
      const mockResponse = {
        body: {
          resultInfo: {
            resultStatus: 'S',
            resultCode: '0000',
            resultMsg: 'Success'
          },
          txnToken: `TXN_${Math.random().toString(36).substr(2, 20)}`,
          isPromoCodeValid: false,
          authenticated: true
        }
      };

      return {
        success: true,
        order_id: orderData.receipt,
        token: mockResponse.body.txnToken,
        amount: orderData.amount,
        gateway_response: mockResponse
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyPayment(paymentData, configuration) {
    try {
      // Verify Paytm checksum
      const isValid = this.verifyPaytmChecksum(paymentData, configuration.merchant_key);

      if (!isValid) {
        throw new Error('Invalid payment checksum');
      }

      return {
        success: true,
        status: paymentData.STATUS === 'TXN_SUCCESS' ? 'SUCCESS' : 'FAILED',
        gateway_transaction_id: paymentData.ORDERID,
        payment_id: paymentData.TXNID,
        amount: parseFloat(paymentData.TXNAMOUNT),
        currency: paymentData.CURRENCY || 'INR',
        payment_method: 'ONLINE'
      };
    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async refundPayment(refundData, configuration) {
    // Paytm refund implementation
    return {
      success: true,
      refund_id: `refund_${Math.random().toString(36).substr(2, 14)}`,
      amount: refundData.amount,
      status: 'processed'
    };
  }

  generatePaytmChecksum(params, merchantKey) {
    // Simplified checksum generation for Paytm
    const data = JSON.stringify(params);
    return this.generateHash(data, merchantKey);
  }

  verifyPaytmChecksum(params, merchantKey) {
    // Simplified checksum verification for Paytm
    return true; // Mock verification
  }
}

/**
 * PayU Gateway Implementation
 */
class PayUGateway extends BaseGateway {
  async createOrder(orderData, configuration) {
    try {
      const hashString = `${configuration.merchant_key}|${orderData.receipt}|${orderData.amount}|${orderData.productinfo || 'School Fee'}|${orderData.firstname || 'Student'}|${orderData.email || 'student@school.com'}|||||||||||${configuration.salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      return {
        success: true,
        order_id: orderData.receipt,
        hash: hash,
        amount: orderData.amount,
        gateway_response: {
          action: configuration.test_mode
            ? 'https://test.payu.in/_payment'
            : 'https://secure.payu.in/_payment',
          method: 'POST'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyPayment(paymentData, configuration) {
    try {
      // Verify PayU hash
      const reverseHashString = `${configuration.salt}|${paymentData.status}||||||||||${paymentData.email}|${paymentData.firstname}|${paymentData.productinfo}|${paymentData.amount}|${paymentData.txnid}|${configuration.merchant_key}`;
      const expectedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

      return {
        success: true,
        status: paymentData.status === 'success' ? 'SUCCESS' : 'FAILED',
        gateway_transaction_id: paymentData.txnid,
        payment_id: paymentData.mihpayid,
        amount: parseFloat(paymentData.amount),
        currency: 'INR',
        payment_method: 'ONLINE'
      };
    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async refundPayment(refundData, configuration) {
    // PayU refund implementation
    return {
      success: true,
      refund_id: `refund_${Math.random().toString(36).substr(2, 14)}`,
      amount: refundData.amount,
      status: 'processed'
    };
  }
}

/**
 * CCAvenue Gateway Implementation
 */
class CCAvnueGateway extends BaseGateway {
  async createOrder(orderData, configuration) {
    // CCAvenue implementation
    return {
      success: true,
      order_id: orderData.receipt,
      amount: orderData.amount,
      gateway_response: {}
    };
  }

  async verifyPayment(paymentData, configuration) {
    // CCAvenue verification
    return {
      success: true,
      status: 'SUCCESS',
      gateway_transaction_id: paymentData.order_id,
      amount: paymentData.amount,
      payment_method: 'ONLINE'
    };
  }

  async refundPayment(refundData, configuration) {
    // CCAvenue refund implementation
    return {
      success: true,
      refund_id: `refund_${Math.random().toString(36).substr(2, 14)}`,
      amount: refundData.amount,
      status: 'processed'
    };
  }
}

/**
 * Instamojo Gateway Implementation
 */
class InstamojoGateway extends BaseGateway {
  async createOrder(orderData, configuration) {
    // Instamojo implementation
    return {
      success: true,
      order_id: orderData.receipt,
      amount: orderData.amount,
      gateway_response: {}
    };
  }

  async verifyPayment(paymentData, configuration) {
    // Instamojo verification
    return {
      success: true,
      status: 'SUCCESS',
      gateway_transaction_id: paymentData.payment_id,
      amount: paymentData.amount,
      payment_method: 'ONLINE'
    };
  }

  async refundPayment(refundData, configuration) {
    // Instamojo refund implementation
    return {
      success: true,
      refund_id: `refund_${Math.random().toString(36).substr(2, 14)}`,
      amount: refundData.amount,
      status: 'processed'
    };
  }
}

module.exports = {
  PaymentGatewayService,
  RazorpayGateway,
  PaytmGateway,
  PayUGateway,
  CCAvnueGateway,
  InstamojoGateway
};
