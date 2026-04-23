import { Linking, Share, Alert } from 'react-native';

const PACKAGE_NAME = 'com.bashirmanafikhi.manafikhi';
const EMAIL = 'bashir.manafikhi@gmail.com';

export class AppActions {
  static async rateApp() {
    try {
      const url = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Unable to open store URL', e);
      Alert.alert('Error', 'Unable to open store');
    }
  }

  static async shareApp() {
    try {
      const message = `جرب تطبيق شجرة عائلة المنافق: \nhttps://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
      await Share.share({ message });
    } catch (e) {
      console.warn('Unable to share app', e);
    }
  }

  static async sendFeedback() {
    try {
      const subject = encodeURIComponent('ملاحظات حول تطبيق شجرة العائلة');
      const body = encodeURIComponent('السلام عليكم،\n\nلدي الملاحظات التالية:\n\n');
      const mailUrl = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      await Linking.openURL(mailUrl);
    } catch (e) {
      console.warn('Unable to open email app', e);
      Alert.alert('Error', 'Unable to open email');
    }
  }
}