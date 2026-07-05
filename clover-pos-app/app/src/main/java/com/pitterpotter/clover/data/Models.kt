package com.pitterpotter.clover.data

import kotlinx.serialization.Serializable

@Serializable
data class Staff(
    val id: String,
    val name: String,
    val username: String,
    val role: String,
    val sessionToken: String,
    val sessionExpiresAt: String? = null
)

@Serializable
data class GiftCard(
    val id: String,
    val code: String,
    val amount: Double,
    val balance: Double,
    val recipientName: String = "",
    val recipientEmail: String = "",
    val senderName: String = "",
    val message: String = "",
    val purchaseDate: String = "",
    val expiryDate: String? = null,
    val status: String = "active"
)

@Serializable
data class RedeemRequest(
    val action: String = "redeem",
    val code: String,
    val amount: Double,
    val username: String,
    val sessionToken: String,
    val totalAmount: Double? = null,
    val remainingAmount: Double? = null,
    val cloverPaymentId: String? = null
)

@Serializable
data class RedeemResponse(
    val success: Boolean = false,
    val error: String? = null,
    val balance: Double? = null,
    val discount: Double? = null,
    val code: String? = null
)

@Serializable
data class BalanceRequest(
    val action: String = "balance",
    val code: String
)

@Serializable
data class BalanceResponse(
    val success: Boolean = false,
    val error: String? = null,
    val balance: Double? = null,
    val amount: Double? = null,
    val status: String? = null
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val success: Boolean = false,
    val error: String? = null,
    val id: String? = null,
    val name: String? = null,
    val username: String? = null,
    val role: String? = null,
    val sessionToken: String? = null,
    val sessionExpiresAt: String? = null
)
