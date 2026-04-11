export interface TelebirrInitParams {
    outTradeNo: string;
    subject: string;
    totalAmount: string;
    notifyUrl: string;
    returnUrl: string;
    timeoutExpress: string;
}
export interface TelebirrInitResult {
    toPayUrl: string;
    txRef: string;
}
export declare function initializeTelebirrPayment(params: TelebirrInitParams): Promise<TelebirrInitResult>;
export interface TelebirrCallbackPayload {
    outTradeNo: string;
    tradeNo: string;
    totalAmount: string;
    tradeStatus: string;
    [key: string]: string;
}
/**
 * Verify Telebirr callback signature.
 * Telebirr signs by concatenating sorted key=value pairs (excluding 'sign') with appKey,
 * then MD5-hashing the result in uppercase.
 */
export declare function verifyTelebirrCallback(params: TelebirrCallbackPayload & {
    sign?: string;
}): boolean;
