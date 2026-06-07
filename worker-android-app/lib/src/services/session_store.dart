import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  static const _workerTokenKey = 'worker_token';
  static const _workerPendingTokenKey = 'worker_pending_token';
  static const _workerLanguageCodeKey = 'worker_language_code';
  static const _workerFavouriteCitiesKey = 'worker_favourite_cities';

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_workerTokenKey, token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_workerTokenKey);
  }

  Future<void> savePendingToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_workerPendingTokenKey, token);
  }

  Future<String?> getPendingToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_workerPendingTokenKey);
  }

  Future<void> clearPendingToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_workerPendingTokenKey);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_workerTokenKey);
    await prefs.remove(_workerPendingTokenKey);
  }

  Future<void> saveLanguageCode(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_workerLanguageCodeKey, languageCode);
  }

  Future<String?> getLanguageCode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_workerLanguageCodeKey);
  }

  Future<void> saveFavouriteCities(List<String> cities) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_workerFavouriteCitiesKey, cities);
  }

  Future<List<String>> getFavouriteCities() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_workerFavouriteCitiesKey) ?? const [];
  }
}
