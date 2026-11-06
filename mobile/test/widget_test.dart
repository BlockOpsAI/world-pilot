import 'package:flutter_test/flutter_test.dart';
import 'package:worldpilot/main.dart';

void main() {
  testWidgets('WorldPilot mobile app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const WorldPilotMobileApp());
    expect(find.text('WorldPilot'), findsWidgets);
    expect(find.text('Observabilité'), findsOneWidget);
  });
}
