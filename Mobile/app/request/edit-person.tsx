import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { submitFamilyRequest, buildEditRequestText } from '../../src/services/googleForms';

export default function EditPersonRequestScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useTheme();
  const [changes, setChanges] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => router.back(), 1600);
    return () => clearTimeout(timer);
  }, [submitted]);

  const handleSubmit = async () => {
    if (!changes.trim()) {
      setErrorMessage('يرجى كتابة التغييرات المطلوبة أولاً.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const text = buildEditRequestText(name || '', id || '', changes, contact);
      await submitFamilyRequest(text);
      setSubmitted(true);
    } catch (e) {
      setErrorMessage('تعذر إرسال الطلب. تحقق من اتصالك بالإنترنت وحاول من جديد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary dark:bg-bg-dark px-8">
        <View className="w-24 h-24 rounded-full bg-[#22c55e]/15 items-center justify-center">
          <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
        </View>
        <Text className="mt-6 text-2xl font-bold text-text-primary dark:text-text-dark text-center">
          تم إرسال طلبك بنجاح
        </Text>
        <Text className="mt-2 text-base text-text-secondary dark:text-text-dark-secondary text-center leading-6">
          شكراً لمساهمتك! سيتم مراجعة الطلب وتحديث المعلومات قريباً.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-primary dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center p-4 rounded-[30px] bg-surface-light dark:bg-surface-dark">
          <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center mr-3">
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-primary dark:text-text-dark" numberOfLines={1}>
              {name || 'شخص'}
            </Text>
            <Text className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">
              رقم السجل: {id}
            </Text>
          </View>
        </View>

        <Text className="mt-8 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          ما التغييرات المطلوبة؟ <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border/10 dark:border-border-dark/10 text-base text-text-primary dark:text-text-dark"
          style={{ minHeight: 140, textAlign: 'right' }}
          placeholder="اكتب هنا التصحيحات أو الإضافات التي تطلبها لهذا الشخص..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={changes}
          onChangeText={setChanges}
        />

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          وسيلة تواصل (اختياري)
        </Text>
        <TextInput
          className="p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border/10 dark:border-border-dark/10 text-base text-text-primary dark:text-text-dark"
          style={{ textAlign: 'right' }}
          placeholder="رقم هاتف أو بريد إلكتروني للتواصل معك عند الحاجة"
          placeholderTextColor={colors.textSecondary}
          value={contact}
          onChangeText={setContact}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {!!errorMessage && (
          <View className="mt-4 flex-row items-center p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text className="flex-1 ml-2 text-sm text-red-600">{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          className={`mt-8 flex-row items-center justify-center py-4 rounded-full bg-primary ${isSubmitting ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text className="text-white text-base font-bold ml-2">جارٍ الإرسال...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text className="text-white text-base font-bold ml-2">إرسال الطلب</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="mt-4 text-xs text-center text-text-secondary dark:text-text-dark-secondary leading-5">
          يصل طلبك إلى مشرف شجرة العائلة لمراجعته وتحديث المعلومات.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
