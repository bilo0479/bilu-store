export interface TelebirrInitParams {
    outTradeNo: string;
    subject: string;
    totalAmount: string;
    notifyUrl: string;
    returnUrl: string;
    timeoutExpress?: string;
}
export interface TelebirrInitResult {
    toPayUrl: string;
    txRef: string;
}
export declare function initializeTelebirrPayment(params: TelebirrInitParams): Promise<TelebirrInitResult>;
export interface TelebirrOrderStatus {
    tradeStatus: string;
    tradeNo?: string;
}
export declare function queryTelebirrOrder(merchOrderId: string): Promise<TelebirrOrderStatus>;
/**
 * Fields Telebirr POSTs to our notifyUrl after payment.
 * Field names follow the OpenAPI spec (snake_case).
 */
export interface TelebirrCallbackPayload {
    merch_order_id: string;
    trade_no?: string;
    trade_status?: string;
    total_amount?: string;
    sign?: string;
    [key: string]: string | undefined;
}
/**
 * Verify payment by querying Telebirr directly rather than trusting callback
 * signature alone. Returns true only when the order status is SUCCESS.
 */
export declare function verifyTelebirrPayment(merchOrderId: string): Promise<boolean>;
