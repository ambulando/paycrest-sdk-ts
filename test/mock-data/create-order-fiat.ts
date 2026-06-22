import { CreateOrderParams, CreateOrderResponse } from "../../src";

// Onramp order: pay fiat (NGN), receive crypto (USDC) at an address.
export const request: CreateOrderParams = {
  "amount": "10000",
  "amountIn": "fiat",
  "reference": "b1f0c7e2-2d3a-4c1b-9f5e-8a2d6c4b1e09",
  "rate": "1366.5",
  "source": {
    "type": "fiat",
    "currency": "NGN",
    "country": "NG",
    "refundAccount": {
      "institution": "OPAYNGPC",
      "accountIdentifier": "9033919709",
      "accountName": "MICHAEL JUNIOR AGOM"
    }
  },
  "destination": {
    "type": "crypto",
    "currency": "USDC",
    "recipient": {
      "address": "0xa706aD54852c9f5A172F25453aAC860d6368964d",
      "network": "arbitrum-one"
    }
  }
}

export const response: CreateOrderResponse = {
  "id": "5c3b8d21-9a44-4f02-bf18-0c2d77e1a934",
  "status": "initiated",
  "orderType": "regular",
  "timestamp": new Date("2026-06-22T08:19:15.228Z"),
  "amount": "10000",
  "rate": "1366.5",
  "senderFee": "0",
  "senderFeePercent": "0",
  "transactionFee": "0",
  "reference": "b1f0c7e2-2d3a-4c1b-9f5e-8a2d6c4b1e09",
  // Onramp: provider supplies the fiat account to pay into.
  "providerAccount": {
    "institution": "OPAYNGPC",
    "accountIdentifier": "9033919709",
    "accountName": "MICHAEL JUNIOR AGOM",
    "amountToTransfer": "10000",
    "currency": "NGN",
    "validUntil": new Date("2026-06-22T09:19:15.185Z")
  },
  "source": {
    "type": "fiat",
    "currency": "NGN",
    "country": "NG",
    "refundAccount": {
      "institution": "OPAYNGPC",
      "accountIdentifier": "9033919709",
      "accountName": "MICHAEL JUNIOR AGOM"
    }
  },
  "destination": {
    "type": "crypto",
    "currency": "USDC",
    "recipient": {
      "address": "0xa706aD54852c9f5A172F25453aAC860d6368964d",
      "network": "arbitrum-one"
    }
  }
}

export const http_response = {
  "status": "success",
  "message": "Payment order initiated successfully",
  "data": response
}
