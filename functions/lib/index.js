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
exports.onTelebirrCallback = exports.onChapaWebhook = exports.onPaymentInitialize = exports.onAdExpiry = exports.onPremiumExpiry = exports.onReviewCreate = exports.onMessageCreate = exports.onAdWrite = void 0;
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
var onPaymentInitialize_1 = require("./triggers/onPaymentInitialize");
Object.defineProperty(exports, "onPaymentInitialize", { enumerable: true, get: function () { return onPaymentInitialize_1.onPaymentInitialize; } });
var onChapaWebhook_1 = require("./triggers/onChapaWebhook");
Object.defineProperty(exports, "onChapaWebhook", { enumerable: true, get: function () { return onChapaWebhook_1.onChapaWebhook; } });
var onTelebirrCallback_1 = require("./triggers/onTelebirrCallback");
Object.defineProperty(exports, "onTelebirrCallback", { enumerable: true, get: function () { return onTelebirrCallback_1.onTelebirrCallback; } });
//# sourceMappingURL=index.js.map