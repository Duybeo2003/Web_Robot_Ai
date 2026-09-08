import crypto from "crypto";
import querystring from "qs";
import { VNPAY_RESERVATION_MINUTES } from "@/lib/commerce-policy";

export function createVnPayUrl(
  transactionReference: string,
  amount: number,
  ipAddr: string = "127.0.0.1",
  orderId: string = transactionReference,
) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Invalid VNPay amount");
  }
  const tmnCode = process.env.VNP_TMN_CODE || "";
  const secretKey = process.env.VNP_HASH_SECRET || "";
  const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNP_RETURN_URL || "";
  if (!tmnCode || !secretKey || !returnUrl) {
    throw new Error("VNPay is not configured");
  }

  const date = new Date();
  const createDate =
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const expireDate = new Date(
    date.getTime() + VNPAY_RESERVATION_MINUTES * 60_000,
  );
  const vnp_ExpireDate =
    expireDate.getFullYear().toString() +
    ("0" + (expireDate.getMonth() + 1)).slice(-2) +
    ("0" + expireDate.getDate()).slice(-2) +
    ("0" + expireDate.getHours()).slice(-2) +
    ("0" + expireDate.getMinutes()).slice(-2) +
    ("0" + expireDate.getSeconds()).slice(-2);

  let vnp_Params: Record<string, string | number> = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = transactionReference;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma don hang " + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = vnp_ExpireDate;

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl =
    vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });
  return paymentUrl;
}

export function verifyVnPayReturn(vnp_Params: Record<string, string>) {
  const secretKey = process.env.VNP_HASH_SECRET || "";

  if (!secretKey) return false;

  const secureHash = vnp_Params["vnp_SecureHash"];
  
  let params = { ...vnp_Params };
  delete params["vnp_SecureHash"];
  delete params["vnp_SecureHashType"];

  params = sortObject(params);

  const signData = querystring.stringify(params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (!secureHash || !/^[a-f\d]{128}$/i.test(secureHash)) return false;
  const providedSignature = Buffer.from(secureHash, "hex");
  const expectedSignature = Buffer.from(signed, "hex");
  return (
    providedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(providedSignature, expectedSignature)
  );
}

function sortObject(obj: Record<string, unknown>) {
  const sorted: Record<string, string> = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(String(obj[str[key]])).replace(/%20/g, "+");
  }
  return sorted;
}
