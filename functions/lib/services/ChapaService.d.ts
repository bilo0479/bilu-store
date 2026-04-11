export interface ChapaInitializeParams {
    amount: number;
    currency: "ETB";
    email: string;
    firstName: string;
    lastName: string;
    txRef: string;
    callbackUrl: string;
    returnUrl: string;
}
export interface ChapaInitializeResult {
    checkoutUrl: string;
    txRef: string;
}
export declare function initializeHostedPayment(params: ChapaInitializeParams): Promise<ChapaInitializeResult>;
export interface ChapaUssdParams {
    amount: number;
    currency: "ETB";
    phone: string;
    txRef: string;
    callbackUrl: string;
}
export declare function initiateUssdPush(params: ChapaUssdParams): Promise<{
    txRef: string;
}>;
export interface ChapaVerifyResult {
    status: "success" | "failed" | "pending";
    amount: number;
    currency: string;
    txRef: string;
}
export declare function verifyTransaction(txRef: string): Promise<ChapaVerifyResult>;
export declare function verifyWebhookSignature(rawBody: string, signature: string): boolean;
