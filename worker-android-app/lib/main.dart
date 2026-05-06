import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/services/worker_push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await WorkerPushService.instance.bootstrap();
  runApp(const WorkerApp());
}
