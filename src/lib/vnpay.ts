import crypto from 'crypto';
import querystring from 'qs';

export function createVnPayUrl(orderId: string, amount: number, ipAddr: string = '127.0.0.1') {
  const tmnCode = process.env.VNP_TMN_CODE || 'MOCK_TMN_CODE';
  const secretKey = process.env.VNP_HASH_SECRET || 'MOCK_SECRET_KEY';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/vnpay/vnpay_return';

  const date = new Date();
  const createDate = date.getFullYear().toString() + 
    ('0' + (date.getMonth() + 1)).slice(-2) + 
    ('0' + date.getDate()).slice(-2) + 
    ('0' + date.getHours()).slice(-2) + 
    ('0' + date.getMinutes()).slice(-2) + 
    ('0' + date.getSeconds()).slice(-2);

  const expireDate = new Date(date.getTime() + 15 * 60000); // 15 mins expiry
  const vnp_ExpireDate = expireDate.getFullYear().toString() + 
    ('0' + (expireDate.getMonth() + 1)).slice(-2) + 
    ('0' + expireDate.getDate()).slice(-2) + 
    ('0' + expireDate.getHours()).slice(-2) + 
    ('0' + expireDate.getMinutes()).slice(-2) + 
    ('0' + expireDate.getSeconds()).slice(-2);

  let vnp_Params: any = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma don hang ' + orderId;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_ExpireDate'] = vnp_ExpireDate;

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;
  
  if (tmnCode === 'MOCK_TMN_CODE') {
    return 'http://localhost:3000/mock-vnpay?' + querystring.stringify(vnp_Params, { encode: false });
  }

  const paymentUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });
  return paymentUrl;
}

export function verifyVnPayReturn(vnp_Params: any) {
  const secretKey = process.env.VNP_HASH_SECRET || 'MOCK_SECRET_KEY';
  
  // Only allow mock bypass in development — NEVER in production
  if (vnp_Params['mock_status'] && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  return secureHash === signed;
}

function sortObject(obj: any) {
  let sorted: any = {};
  let str = [];
  let key;
  for (key in obj){
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
