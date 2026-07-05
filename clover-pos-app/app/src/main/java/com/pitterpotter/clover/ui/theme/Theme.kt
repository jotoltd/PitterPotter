package com.pitterpotter.clover.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = Primary,
    secondary = Secondary,
    tertiary = Tertiary,
    background = Background,
    surface = Surface,
    error = Error,
    onPrimary = Background,
    onSecondary = Primary,
    onBackground = Primary,
    onSurface = Primary
)

private val DarkColors = darkColorScheme(
    primary = Tertiary,
    secondary = Primary,
    tertiary = Secondary,
    background = Primary,
    surface = Primary,
    error = Error,
    onPrimary = Primary,
    onSecondary = Tertiary,
    onBackground = Background,
    onSurface = Background
)

@Composable
fun PitterPotterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content
    )
}
