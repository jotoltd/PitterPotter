package com.pitterpotter.clover

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pitterpotter.clover.data.BalanceResponse
import com.pitterpotter.clover.data.GiftCard
import com.pitterpotter.clover.data.Staff
import com.pitterpotter.clover.data.SupabaseClient
import com.pitterpotter.clover.payment.CloverPaymentManager
import com.pitterpotter.clover.payment.CloverPaymentResult
import kotlinx.coroutines.launch

sealed class Screen {
    object Login : Screen()
    object Home : Screen()
    object Scan : Screen()
    object ManualEntry : Screen()
    data class Payment(val card: GiftCard) : Screen()
    data class Result(val summary: TransactionSummary) : Screen()
}

data class TransactionSummary(
    val success: Boolean,
    val giftCardCode: String,
    val totalAmount: Double,
    val giftCardDiscount: Double,
    val remainingAmount: Double,
    val giftCardBalanceAfter: Double?,
    val cloverPaymentId: String?,
    val errorMessage: String? = null
)

class PosViewModel(application: Application) : AndroidViewModel(application) {
    private val client = SupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY
    )

    private val cloverPaymentManager = CloverPaymentManager(application)

    var currentScreen by mutableStateOf<Screen>(Screen.Login)
        private set

    var staff by mutableStateOf<Staff?>(null)
        private set

    var isLoading by mutableStateOf(false)
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set

    var scannedCode by mutableStateOf("")
        private set

    var totalAmount by mutableDoubleStateOf(0.0)
        private set

    var currentCard by mutableStateOf<GiftCard?>(null)
        private set

    init {
        cloverPaymentManager.getAccount()?.let { cloverPaymentManager.connect(it) }
    }

    override fun onCleared() {
        super.onCleared()
        cloverPaymentManager.disconnect()
    }

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            errorMessage = "Enter username and password"
            return
        }
        isLoading = true
        errorMessage = null
        viewModelScope.launch {
            val result = client.login(username, password)
            isLoading = false
            result.fold(
                onSuccess = { loggedInStaff ->
                    staff = loggedInStaff
                    currentScreen = Screen.Home
                },
                onFailure = { error ->
                    errorMessage = error.message ?: "Login failed"
                }
            )
        }
    }

    fun logout() {
        staff = null
        currentScreen = Screen.Login
        currentCard = null
        scannedCode = ""
        totalAmount = 0.0
    }

    fun navigateTo(screen: Screen) {
        currentScreen = screen
        errorMessage = null
    }

    fun setScannedCode(code: String) {
        scannedCode = code
    }

    fun checkBalance(code: String, onSuccess: (BalanceResponse) -> Unit = {}) {
        if (code.isBlank()) {
            errorMessage = "Enter a gift card code"
            return
        }
        isLoading = true
        errorMessage = null
        viewModelScope.launch {
            val result = client.checkBalance(code)
            isLoading = false
            result.fold(
                onSuccess = { response ->
                    if (response.success && response.balance != null) {
                        onSuccess(response)
                    } else {
                        errorMessage = response.error ?: "Unable to check balance"
                    }
                },
                onFailure = { error ->
                    errorMessage = error.message ?: "Balance check failed"
                }
            )
        }
    }

    fun loadCardForPayment(code: String) {
        checkBalance(code) { response ->
            val card = GiftCard(
                id = "",
                code = code,
                amount = response.amount ?: 0.0,
                balance = response.balance ?: 0.0,
                status = response.status ?: "unknown"
            )
            currentCard = card
            currentScreen = Screen.Payment(card)
        }
    }

    fun setTotalAmount(amount: Double) {
        totalAmount = amount
    }

    fun processPayment() {
        val card = currentCard ?: return
        val staffMember = staff ?: return
        if (totalAmount <= 0) {
            errorMessage = "Enter a total amount"
            return
        }

        val giftCardDiscount = minOf(card.balance, totalAmount)
        val remainingAmount = totalAmount - giftCardDiscount

        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            try {
                // Step 1: charge remaining amount on Clover if needed
                var cloverResult: CloverPaymentResult? = null
                var cloverPaymentId: String? = null
                if (remainingAmount > 0) {
                    val amountPence = (remainingAmount * 100).toLong()
                    cloverResult = cloverPaymentManager.charge(
                        amountPence = amountPence,
                        description = "Pitter Potter - remaining after gift card"
                    )
                    when (cloverResult) {
                        is CloverPaymentResult.Failure -> {
                            isLoading = false
                            currentScreen = Screen.Result(
                                TransactionSummary(
                                    success = false,
                                    giftCardCode = card.code,
                                    totalAmount = totalAmount,
                                    giftCardDiscount = 0.0,
                                    remainingAmount = totalAmount,
                                    giftCardBalanceAfter = null,
                                    cloverPaymentId = null,
                                    errorMessage = "Clover card payment failed: ${cloverResult.message}"
                                )
                            )
                            return@launch
                        }
                        is CloverPaymentResult.Canceled -> {
                            isLoading = false
                            currentScreen = Screen.Result(
                                TransactionSummary(
                                    success = false,
                                    giftCardCode = card.code,
                                    totalAmount = totalAmount,
                                    giftCardDiscount = 0.0,
                                    remainingAmount = totalAmount,
                                    giftCardBalanceAfter = null,
                                    cloverPaymentId = null,
                                    errorMessage = "Clover card payment was canceled"
                                )
                            )
                            return@launch
                        }
                        is CloverPaymentResult.Success -> {
                            cloverPaymentId = cloverResult.paymentId
                        }
                        null -> {}
                    }
                }

                // Step 2: redeem gift card if applicable
                var giftCardBalanceAfter: Double? = null
                if (giftCardDiscount > 0) {
                    val redeemResult = client.redeem(
                        code = card.code,
                        amount = giftCardDiscount,
                        staff = staffMember,
                        totalAmount = totalAmount,
                        remainingAmount = remainingAmount,
                        cloverPaymentId = cloverPaymentId
                    )
                    if (redeemResult.isFailure) {
                        isLoading = false
                        currentScreen = Screen.Result(
                            TransactionSummary(
                                success = false,
                                giftCardCode = card.code,
                                totalAmount = totalAmount,
                                giftCardDiscount = 0.0,
                                remainingAmount = totalAmount,
                                giftCardBalanceAfter = null,
                                cloverPaymentId = cloverPaymentId,
                                errorMessage = "Gift card redemption failed: ${redeemResult.exceptionOrNull()?.message}"
                            )
                        )
                        return@launch
                    }
                    val redeemData = redeemResult.getOrNull()
                    if (redeemData == null || !redeemData.success) {
                        isLoading = false
                        currentScreen = Screen.Result(
                            TransactionSummary(
                                success = false,
                                giftCardCode = card.code,
                                totalAmount = totalAmount,
                                giftCardDiscount = 0.0,
                                remainingAmount = totalAmount,
                                giftCardBalanceAfter = null,
                                cloverPaymentId = cloverPaymentId,
                                errorMessage = redeemData?.error ?: "Gift card redemption failed"
                            )
                        )
                        return@launch
                    }
                    giftCardBalanceAfter = redeemData.balance
                }

                isLoading = false
                currentScreen = Screen.Result(
                    TransactionSummary(
                        success = true,
                        giftCardCode = card.code,
                        totalAmount = totalAmount,
                        giftCardDiscount = giftCardDiscount,
                        remainingAmount = remainingAmount,
                        giftCardBalanceAfter = giftCardBalanceAfter,
                        cloverPaymentId = cloverPaymentId
                    )
                )
                resetTransaction()
            } catch (e: Exception) {
                isLoading = false
                currentScreen = Screen.Result(
                    TransactionSummary(
                        success = false,
                        giftCardCode = card.code,
                        totalAmount = totalAmount,
                        giftCardDiscount = 0.0,
                        remainingAmount = totalAmount,
                        giftCardBalanceAfter = null,
                        cloverPaymentId = null,
                        errorMessage = "Unexpected error: ${e.message}"
                    )
                )
            }
        }
    }

    private fun resetTransaction() {
        currentCard = null
        scannedCode = ""
        totalAmount = 0.0
    }

    fun clearError() {
        errorMessage = null
    }

    class Factory(private val application: Application) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
            return PosViewModel(application) as T
        }
    }
}
