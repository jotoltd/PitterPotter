package com.pitterpotter.clover.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.pitterpotter.clover.PosViewModel
import com.pitterpotter.clover.Screen
import com.pitterpotter.clover.data.GiftCard
import com.pitterpotter.clover.ui.theme.Success

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(viewModel: PosViewModel, card: GiftCard) {
    var amount by remember { mutableStateOf("") }
    val totalAmount = amount.toDoubleOrNull() ?: 0.0
    val giftCardDiscount = if (card.status == "active") minOf(card.balance, totalAmount) else 0.0
    val remainingAmount = totalAmount - giftCardDiscount
    val statusText = if (card.status == "active") "Active" else card.status.replaceFirstChar { it.uppercase() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Payment") },
                navigationIcon = {
                    IconButton(onClick = { viewModel.navigateTo(Screen.Home) }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = card.code,
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = "Status: $statusText",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "Balance: £${"%.2f".format(card.balance)}",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary
            )
            if (card.status != "active") {
                Text(
                    text = "This card cannot be used.",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Total amount to charge (£)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Decimal,
                    imeAction = ImeAction.Done
                ),
                modifier = Modifier.fillMaxWidth()
            )
            if (totalAmount > 0 && card.status == "active") {
                PaymentBreakdown(
                    total = totalAmount,
                    giftCardDiscount = giftCardDiscount,
                    remaining = remainingAmount
                )
            }
            if (viewModel.errorMessage != null) {
                Text(
                    text = viewModel.errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Button(
                onClick = {
                    val parsed = amount.toDoubleOrNull()
                    if (parsed != null && parsed > 0) {
                        viewModel.setTotalAmount(parsed)
                        viewModel.processPayment()
                    } else {
                        viewModel.errorMessage = "Enter a valid amount"
                    }
                },
                enabled = !viewModel.isLoading && card.status == "active" && amount.isNotBlank() && totalAmount > 0,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (viewModel.isLoading) {
                    CircularProgressIndicator()
                } else {
                    Text(
                        when {
                            remainingAmount > 0 -> "Pay with Gift Card + Clover"
                            else -> "Pay with Gift Card"
                        }
                    )
                }
            }
            OutlinedButton(
                onClick = { viewModel.navigateTo(Screen.Home) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Cancel")
            }
        }
    }
}

@Composable
private fun PaymentBreakdown(total: Double, giftCardDiscount: Double, remaining: Double) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        BreakdownRow("Total", "£${"%.2f".format(total)}")
        BreakdownRow("Gift card discount", "-£${"%.2f".format(giftCardDiscount)}")
        if (remaining > 0) {
            BreakdownRow("Remaining on Clover", "£${"%.2f".format(remaining)}", isBold = true)
        } else {
            Text(
                text = "Gift card covers full amount",
                style = MaterialTheme.typography.bodyMedium,
                color = Success
            )
        }
    }
}

@Composable
private fun BreakdownRow(label: String, value: String, isBold: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = if (isBold) MaterialTheme.typography.bodyLarge else MaterialTheme.typography.bodyMedium
        )
        Text(
            text = value,
            style = if (isBold) MaterialTheme.typography.bodyLarge else MaterialTheme.typography.bodyMedium,
            color = if (isBold) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
        )
    }
}
