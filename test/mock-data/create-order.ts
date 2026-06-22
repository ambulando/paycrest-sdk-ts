import {CreateOrderParams, CreateOrderResponse} from "../../src";

export const request: CreateOrderParams = {
  "amount": "0.5",
  "reference": "{{$randomUUID}}",
  "rate": "1366.5",
  "source": {
    "type": "crypto",
    "currency": "USDC",
    "network": "arbitrum-one",
    "refundAddress": "0xa706aD54852c9f5A172F25453aAC860d6368964d"
  },
  "destination": {
    "type": "fiat",
    "currency": "NGN",
    "recipient": {
      "institution": "OPAYNGPC",
      "accountIdentifier": "123456",
      "accountName": "Rory Gallagher",
      "memo": "Transfer via Blinx 18:37"
    }
  }
}

export const response: CreateOrderResponse = {
  "id": "0ed20b4c-b8ea-4342-a411-9724880f197a",
  "status": "initiated",
  "orderType": "regular",
  "timestamp": new Date("2026-06-22T08:19:15.228533127Z"),
  "amount": "0.5",
  "rate": "1366.5",
  "senderFee": "0.005",
  "senderFeePercent": "1",
  "transactionFee": "0",
  "reference": "265d8a54-b729-42ce-936d-41bbeeacedd6",
  "providerAccount": {
    "network": "arbitrum-one",
    "receiveAddress": "0x527fd8489d3966C2cff9bA243Fd40EB97B4dE9B6",
    "validUntil": new Date("2026-06-22T09:19:15.185652293Z")
  },
  "source": {
    "type": "crypto",
    "currency": "USDC",
    "network": "arbitrum-one",
    "refundAddress": "0xa706aD54852c9f5A172F25453aAC860d6368964d"
  },
  "destination": {
    "type": "fiat",
    "currency": "NGN",
    "recipient": {
      "institution": "OPAYNGPC",
      "institutionName": "OPay",
      "accountIdentifier": "9033919709",
      "accountName": "MICHAEL JUNIOR AGOM",
      "memo": "Transfer via Blinx 18:37"
    }
  }
}

export const http_response = {
  "status": "success",
  "message": "Payment order initiated successfully",
  "data": response
}