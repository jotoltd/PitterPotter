package com.pitterpotter.clover.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.Composable
import com.pitterpotter.clover.PosViewModel
import com.pitterpotter.clover.Screen

@Composable
fun CloverPosApp(viewModel: PosViewModel) {
    AnimatedContent(
        targetState = viewModel.currentScreen,
        transitionSpec = {
            fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
        },
        label = "screen-transition"
    ) { screen ->
        when (screen) {
            is Screen.Login -> LoginScreen(viewModel)
            is Screen.Home -> HomeScreen(viewModel)
            is Screen.Scan -> ScanScreen(viewModel)
            is Screen.ManualEntry -> ManualEntryScreen(viewModel)
            is Screen.Payment -> PaymentScreen(viewModel, screen.card)
            is Screen.Result -> ResultScreen(viewModel, screen.success, screen.message)
        }
    }
}
