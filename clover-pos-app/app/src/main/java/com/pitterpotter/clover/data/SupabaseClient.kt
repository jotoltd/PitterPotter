package com.pitterpotter.clover.data

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class SupabaseClient(
    private val supabaseUrl: String,
    private val supabaseAnonKey: String
) {
    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        defaultRequest {
            header("Authorization", "Bearer $supabaseAnonKey")
            contentType(ContentType.Application.Json)
        }
    }

    suspend fun login(username: String, password: String): Result<Staff> {
        return try {
            val response = client.post("$supabaseUrl/functions/v1/staff-login") {
                setBody(LoginRequest(username, password))
            }

            if (response.status != HttpStatusCode.OK) {
                return Result.failure(Exception("Login failed: ${response.status}"))
            }

            val data = response.body<LoginResponse>()
            if (data.success == false || data.sessionToken == null) {
                return Result.failure(Exception(data.error ?: "Login failed"))
            }

            Result.success(
                Staff(
                    id = data.id ?: "",
                    name = data.name ?: "",
                    username = data.username ?: "",
                    role = data.role ?: "staff",
                    sessionToken = data.sessionToken,
                    sessionExpiresAt = data.sessionExpiresAt
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkBalance(code: String): Result<BalanceResponse> {
        return try {
            val response = client.post("$supabaseUrl/functions/v1/redeem-gift-card") {
                setBody(BalanceRequest(code = code))
            }

            if (response.status != HttpStatusCode.OK) {
                return Result.failure(Exception("Balance check failed: ${response.status}"))
            }

            Result.success(response.body<BalanceResponse>())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun redeem(
        code: String,
        amount: Double,
        staff: Staff,
        totalAmount: Double? = null,
        remainingAmount: Double? = null,
        cloverPaymentId: String? = null
    ): Result<RedeemResponse> {
        return try {
            val response = client.post("$supabaseUrl/functions/v1/redeem-gift-card") {
                setBody(
                    RedeemRequest(
                        code = code,
                        amount = amount,
                        username = staff.username,
                        sessionToken = staff.sessionToken,
                        totalAmount = totalAmount,
                        remainingAmount = remainingAmount,
                        cloverPaymentId = cloverPaymentId
                    )
                )
            }

            if (response.status != HttpStatusCode.OK) {
                return Result.failure(Exception("Redeem failed: ${response.status}"))
            }

            Result.success(response.body<RedeemResponse>())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
