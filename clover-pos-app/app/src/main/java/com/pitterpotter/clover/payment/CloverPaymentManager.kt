package com.pitterpotter.clover.payment

import android.accounts.Account
import android.content.Context
import android.os.RemoteException
import com.clover.sdk.util.CloverAccount
import com.clover.sdk.v3.order.OrderConnector
import com.clover.sdk.v3.order.LineItem
import com.clover.sdk.v3.payments.PaymentConnector
import com.clover.sdk.v3.payments.Payment
import com.clover.sdk.v3.payments.ResultStatus
import com.clover.sdk.v3.payments.SaleRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

sealed class CloverPaymentResult {
    data class Success(
        val paymentId: String,
        val amount: Long,
        val receiptUrl: String? = null
    ) : CloverPaymentResult()

    data class Failure(val message: String) : CloverPaymentResult()
    data object Canceled : CloverPaymentResult()
}

class CloverPaymentManager(private val context: Context) {

    private var orderConnector: OrderConnector? = null
    private var paymentConnector: PaymentConnector? = null

    fun getAccount(): Account? = CloverAccount.getAccount(context)

    fun connect(account: Account = getAccount() ?: error("No Clover account found")) {
        disconnect()
        orderConnector = OrderConnector(context, account, null)
        paymentConnector = PaymentConnector(context, account, null)
    }

    fun disconnect() {
        try {
            orderConnector?.disconnect()
            paymentConnector?.disconnect()
        } catch (_: Exception) {
        } finally {
            orderConnector = null
            paymentConnector = null
        }
    }

    suspend fun charge(amountPence: Long, description: String): CloverPaymentResult {
        val orderConnector = this.orderConnector ?: return CloverPaymentResult.Failure("Clover not connected")
        val paymentConnector = this.paymentConnector ?: return CloverPaymentResult.Failure("Clover not connected")

        return withContext(Dispatchers.IO) {
            try {
                val order = createOrder(orderConnector, amountPence, description)
                    ?: return@withContext CloverPaymentResult.Failure("Failed to create Clover order")

                val saleRequest = SaleRequest().apply {
                    this.amount = amountPence
                    this.orderId = order.id
                    this.tippableAmount = 0L
                    this.taxAmount = 0L
                }

                suspendCancellableCoroutine { continuation ->
                    val listener = object : PaymentConnector.OnSaleResponseListener {
                        override fun onSaleResponse(response: com.clover.sdk.v3.payments.SaleResponse) {
                            when (response.result) {
                                ResultStatus.SUCCESS -> {
                                    val payment: Payment? = response.payment
                                    if (payment != null) {
                                        continuation.resume(
                                            CloverPaymentResult.Success(
                                                paymentId = payment.id,
                                                amount = payment.amount,
                                                receiptUrl = payment.receiptUrl
                                            )
                                        )
                                    } else {
                                        continuation.resume(CloverPaymentResult.Failure("Payment succeeded but no payment ID returned"))
                                    }
                                }
                                ResultStatus.CANCEL -> continuation.resume(CloverPaymentResult.Canceled)
                                ResultStatus.FAIL -> {
                                    val reason = response.reason ?: response.message ?: "Payment failed"
                                    continuation.resume(CloverPaymentResult.Failure(reason))
                                }
                            }
                        }
                    }

                    paymentConnector.addOnSaleResponseListener(listener)
                    paymentConnector.sale(saleRequest)

                    continuation.invokeOnCancellation {
                        paymentConnector.removeOnSaleResponseListener(listener)
                    }
                }
            } catch (e: RemoteException) {
                CloverPaymentResult.Failure("Clover connection error: ${e.message}")
            } catch (e: IllegalStateException) {
                CloverPaymentResult.Failure("Clover error: ${e.message}")
            } catch (e: Exception) {
                CloverPaymentResult.Failure("Unexpected error: ${e.message}")
            }
        }
    }

    private suspend fun createOrder(
        connector: OrderConnector,
        amountPence: Long,
        description: String
    ): com.clover.sdk.v3.order.Order? = suspendCancellableCoroutine { continuation ->
        try {
            val lineItem = LineItem().apply {
                this.name = description
                this.price = amountPence
            }
            connector.createOrder(null, null, lineItem, null, object : OrderConnector.OnCreateOrderListener {
                override fun onCreateOrderSuccess(order: com.clover.sdk.v3.order.Order) {
                    continuation.resume(order)
                }

                override fun onCreateOrderFailure(e: RemoteException) {
                    continuation.resumeWithException(e)
                }
            })
        } catch (e: Exception) {
            continuation.resumeWithException(e)
        }
    }
}
