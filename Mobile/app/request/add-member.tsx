import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { submitFamilyRequest, buildAddMemberRequestText } from '../../src/services/googleForms';

export default function AddMemberRequestScreen() {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [birthDate, setBirthDate] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => router.back(), 1600);
    return () => clearTimeout(timer);
  }, [submitted]);

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setErrorMessage('يرجى إدخال الاسم الأول على الأقل.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const text = buildAddMemberRequestText({
        firstName,
        lastName,
        gender,
        birthDate,
        isAlive,
        fatherName,
        motherName,
        notes,
      });
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
          شكراً لمساهمتك! سيتم مراجعة الطلب وإضافة الفرد قريباً.
        </Text>
      </View>
    );
  }

  const inputClass =
    'p-4 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border/10 dark:border-border-dark/10 text-base text-text-primary dark:text-text-dark';

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
        <Text className="mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          الاسم الأول <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={inputClass}
          style={{ textAlign: 'right' }}
          placeholder="الاسم الأول للفرد الجديد"
          placeholderTextColor={colors.textSecondary}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          اسم العائلة
        </Text>
        <TextInput
          className={inputClass}
          style={{ textAlign: 'right' }}
          placeholder="اختياري"
          placeholderTextColor={colors.textSecondary}
          value={lastName}
          onChangeText={setLastName}
        />

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">الجنس</Text>
        <View className="flex-row gap-3">
          {(['MALE', 'FEMALE'] as const).map(g => {
            const selected = gender === g;
            const label = g === 'MALE' ? 'ذكر' : 'أنثى';
            const icon = g === 'MALE' ? 'male' : 'female';
            return (
              <TouchableOpacity
                key={g}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-full border ${
                  selected
                    ? 'bg-primary/15 border-primary'
                    : 'bg-surface-light dark:bg-surface-dark border-border/10 dark:border-border-dark/10'
                }`}
                onPress={() => setGender(g)}
              >
                <Ionicons
                  name={icon}
                  size={18}
                  color={selected ? colors.primary : '#9ca3af'}
                />
                <Text
                  className={`ml-2 text-base ${selected ? 'font-bold text-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          تاريخ الميلاد
        </Text>
        <TextInput
          className={inputClass}
          style={{ textAlign: 'right' }}
          placeholder="مثال: 1990 أو 1990/5/12 — اختياري"
          placeholderTextColor={colors.textSecondary}
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <View className="mt-6 flex-row items-center justify-between p-4 rounded-3xl bg-surface-light dark:bg-surface-dark">
          <Switch
            value={isAlive}
            onValueChange={setIsAlive}
            trackColor={{ false: '#e0e0e0', true: '#bc6798' }}
            thumbColor={isAlive ? '#fff' : '#f5f5f5'}
          />
          <Text className="text-base font-bold text-text-primary dark:text-text-dark">
            على قيد الحياة
          </Text>
        </View>

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          اسم الأب
        </Text>
        <TextInput
          className={inputClass}
          style={{ textAlign: 'right' }}
          placeholder="اختياري"
          placeholderTextColor={colors.textSecondary}
          value={fatherName}
          onChangeText={setFatherName}
        />

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          اسم الأم
        </Text>
        <TextInput
          className={inputClass}
          style={{ textAlign: 'right' }}
          placeholder="اختياري"
          placeholderTextColor={colors.textSecondary}
          value={motherName}
          onChangeText={setMotherName}
        />

        <Text className="mt-6 mb-2 text-base font-bold text-text-primary dark:text-text-dark">
          ملاحظات
        </Text>
        <TextInput
          className={inputClass}
          style={{ minHeight: 110, textAlign: 'right' }}
          placeholder="أي معلومات إضافية تودّ إيصالها — اختياري"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={notes}
          onChangeText={setNotes}
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
          يصل طلبك إلى مشرف شجرة العائلة لمراجعته وإضافة الفرد.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
