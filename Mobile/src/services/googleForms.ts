import { REQUEST_FORM_ID, REQUEST_FORM_ENTRIES } from '../config/forms';

const FORM_RESPONSE_URL = `https://docs.google.com/forms/d/e/${REQUEST_FORM_ID}/formResponse`;

const TIMEOUT_MS = 15000;

export interface AddMemberRequestData {
  firstName: string;
  lastName?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: string;
  isAlive: boolean;
  fatherName?: string;
  motherName?: string;
  notes?: string;
}

export function buildEditRequestText(
  personName: string,
  personId: string,
  changes: string,
  contact?: string
): string {
  const lines = [
    '[تعديل معلومات]',
    `الشخص: ${personName}`,
    `المعرّف: ${personId}`,
    '',
    changes.trim(),
  ];
  const trimmedContact = contact?.trim();
  if (trimmedContact) {
    lines.push('', `وسيلة تواصل: ${trimmedContact}`);
  }
  return lines.join('\n');
}

export function buildAddMemberRequestText(data: AddMemberRequestData): string {
  const lines = [
    '[إضافة فرد جديد]',
    '',
    `الاسم الأول: ${data.firstName.trim()}`,
  ];
  const optional: Array<[string, string | undefined]> = [
    ['اسم العائلة', data.lastName],
    ['الجنس', data.gender === 'MALE' ? 'ذكر' : 'أنثى'],
    ['تاريخ الميلاد', data.birthDate],
    ['على قيد الحياة', data.isAlive ? 'نعم' : 'لا'],
    ['اسم الأب', data.fatherName],
    ['اسم الأم', data.motherName],
  ];
  for (const [label, value] of optional) {
    const trimmed = value?.trim();
    if (trimmed) {
      lines.push(`${label}: ${trimmed}`);
    }
  }
  const notes = data.notes?.trim();
  if (notes) {
    lines.push('', `ملاحظات: ${notes}`);
  }
  return lines.join('\n');
}

export async function submitFamilyRequest(details: string): Promise<void> {
  const body = `${REQUEST_FORM_ENTRIES.details}=${encodeURIComponent(details)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(FORM_RESPONSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: controller.signal,
    });
    if (response.status >= 400) {
      throw new Error(`Google Form responded with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
