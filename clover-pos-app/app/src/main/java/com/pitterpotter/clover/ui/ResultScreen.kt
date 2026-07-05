package com.pitterpotter.clover.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pitterpotter.clover.PosViewModel
import com.pitterpotter.clover.Screen
import com.pitterpotter.clover.TransactionSummary

@Composable
fun ResultScreen(viewModel: PosViewModel, summary: TransactionSummary) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = if (summary.success) Icons.Default.CheckCircle else Icons.Default.Error,
            contentDescription = if (summary.success) "Success" else "Error",
            tint = if (summary.success) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            modifier = Modifier.size(80.dp)
        )
        Text(
            text = if (summary.success) "Payment Successful" else "Payment Failed",
            style = MaterialTheme.typography.headlineMedium,
            color = if (summary.success) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
        )

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ResultRow("Total", "£${"%.2f".format(summary.totalAmount)}")
            ResultRow("Gift card", "-£${"%.2f".format(summary.giftCardDiscount)}")
            if (summary.remainingAmount > 0) {
                ResultRow("Clover card", "£${"%.2f".format(summary.remainingAmount)}")
            }
            if (summary.giftCardBalanceAfter != null) {
                ResultRow("Gift card balance", "£${"%.2f".format(summary.giftCardBalanceAfter)}")
            }
            summary.cloverPaymentId?.let { id ->
                Text(
                    text = "Clover payment: ${id.take(12)}…",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }

        if (summary.errorMessage != null) {
            Text(
                text = summary.errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { viewModel.navigateTo(Screen.Home) },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Done")
        }
    }
}

@Composable
private fun ResultRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
    }
}
