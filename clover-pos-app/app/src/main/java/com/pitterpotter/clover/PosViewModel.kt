package com.pitterpotter.clover

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pitterpotter.clover.data.BalanceResponse
import com.pitterpotter.clover.data.GiftCard
import com.pitterpotter.clover.data.RedeemResponse
import com.pitterpotter.clover.data.Staff
import com.pitterpotter.clover.data.SupabaseClient
import kotlinx.coroutines.launch

sealed class Screen {
    object Login : Screen()
    object Home : Screen()
    object Scan : Screen()
    object ManualEntry : Screen()
    data class Payment(val card: GiftCard) : Screen()
    data class Result(val success: Boolean, val message: String) : Screen()
}

class PosViewModel : ViewModel() {
    private val client = SupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY
    )

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

    var paymentAmount by mutableDoubleStateOf(0.0)
        private set

    var currentCard by mutableStateOf<GiftCard?>(null)
        private set

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
        paymentAmount = 0.0
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

    fun setPaymentAmount(amount: Double) {
        paymentAmount = amount
    }

    fun payWithGiftCard() {
        val card = currentCard ?: return
        val staffMember = staff ?: return
        if (paymentAmount <= 0) {
            errorMessage = "Enter a payment amount"
            return
        }
        if (paymentAmount > card.balance) {
            errorMessage = "Insufficient balance"
            return
        }
        isLoading = true
        errorMessage = null
        viewModelScope.launch {
            val result = client.redeem(card.code, paymentAmount, staffMember)
            isLoading = false
            result.fold(
                onSuccess = { response ->
                    if (response.success) {
                        currentScreen = Screen.Result(
                            success = true,
                            message = "Paid £${"%.2f".format(paymentAmount)} from ${card.code}. New balance: £${"%.2f".format(response.balance ?: 0.0)}"
                        )
                        currentCard = null
                        scannedCode = ""
                        paymentAmount = 0.0
                    } else {
                        errorMessage = response.error ?: "Payment failed"
                    }
                },
                onFailure = { error ->
                    errorMessage = error.message ?: "Payment failed"
                }
            )
        }
    }

    fun clearError() {
        errorMessage = null
    }
}
