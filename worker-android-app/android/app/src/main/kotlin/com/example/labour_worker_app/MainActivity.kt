package com.example.labour_worker_app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import android.content.Context
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createWorkerAlertsChannel()
    }

    private fun createWorkerAlertsChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            "worker_alerts",
            "Worker Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "ScaleVyapar Rozgar job, wallet, and application alerts"
        }

        manager.createNotificationChannel(channel)
    }
}
