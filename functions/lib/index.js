"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRequestRefund = exports.onEscrowPayout = exports.onVerifyDelivery = exports.onTelebirrEscrowCallback = exports.onChapaEscrowCallback = exports.onInitiateEscrow = exports.onTelebirrCallback = exports.onChapaWebhook = exports.onPaymentInitialize = exports.onAdExpiry = exports.onPremiumExpiry = exports.onReviewCreate = exports.onMessageCreate = exports.onAdWrite = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var onAdWrite_1 = require("./triggers/onAdWrite");
Object.defineProperty(exports, "onAdWrite", { enumerable: true, get: function () { return onAdWrite_1.onAdWrite; } });
var onMessageCreate_1 = require("./triggers/onMessageCreate");
Object.defineProperty(exports, "onMessageCreate", { enumerable: true, get: function () { return onMessageCreate_1.onMessageCreate; } });
var onReviewCreate_1 = require("./triggers/onReviewCreate");
Object.defineProperty(exports, "onReviewCreate", { enumerable: true, get: function () { return onReviewCreate_1.onReviewCreate; } });
var onPremiumExpiry_1 = require("./triggers/onPremiumExpiry");
Object.defineProperty(exports, "onPremiumExpiry", { enumerable: true, get: function () { return onPremiumExpiry_1.onPremiumExpiry; } });
var onAdExpiry_1 = require("./triggers/onAdExpiry");
Object.defineProperty(exports, "onAdExpiry", { enumerable: true, get: function () { return onAdExpiry_1.onAdExpiry; } });
// Premium boost payments
var onPaymentInitialize_1 = require("./triggers/onPaymentInitialize");
Object.defineProperty(exports, "onPaymentInitialize", { enumerable: true, get: function () { return onPaymentInitialize_1.onPaymentInitialize; } });
var onChapaWebhook_1 = require("./triggers/onChapaWebhook");
Object.defineProperty(exports, "onChapaWebhook", { enumerable: true, get: function () { return onChapaWebhook_1.onChapaWebhook; } });
var onTelebirrCallback_1 = require("./triggers/onTelebirrCallback");
Object.defineProperty(exports, "onTelebirrCallback", { enumerable: true, get: function () { return onTelebirrCallback_1.onTelebirrCallback; } });
// Escrow / buy-now payments
var onInitiateEscrow_1 = require("./triggers/onInitiateEscrow");
Object.defineProperty(exports, "onInitiateEscrow", { enumerable: true, get: function () { return onInitiateEscrow_1.onInitiateEscrow; } });
var onChapaEscrowCallback_1 = require("./triggers/onChapaEscrowCallback");
Object.defineProperty(exports, "onChapaEscrowCallback", { enumerable: true, get: function () { return onChapaEscrowCallback_1.onChapaEscrowCallback; } });
var onTelebirrEscrowCallback_1 = require("./triggers/onTelebirrEscrowCallback");
Object.defineProperty(exports, "onTelebirrEscrowCallback", { enumerable: true, get: function () { return onTelebirrEscrowCallback_1.onTelebirrEscrowCallback; } });
var onVerifyDelivery_1 = require("./triggers/onVerifyDelivery");
Object.defineProperty(exports, "onVerifyDelivery", { enumerable: true, get: function () { return onVerifyDelivery_1.onVerifyDelivery; } });
var onEscrowPayout_1 = require("./triggers/onEscrowPayout");
Object.defineProperty(exports, "onEscrowPayout", { enumerable: true, get: function () { return onEscrowPayout_1.onEscrowPayout; } });
var onRequestRefund_1 = require("./triggers/onRequestRefund");
Object.defineProperty(exports, "onRequestRefund", { enumerable: true, get: function () { return onRequestRefund_1.onRequestRefund; } });
//# sourceMappingURL=index.js.map