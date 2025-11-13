export interface ConciergeAfterHoursCSVRow {
  [key: string]: string | number;
}

export interface TransformedAfterHoursCall {
  call_timestamp: string;
  member_name_with_phone: string;
  member_name: string;
  phone_number: string;
  notes?: string;
}

export interface AfterHoursSummary {
  totalCalls: number;
  weekendCalls: number;
  lateNightCalls: number;
  earlyMorningCalls: number;
  avgCallsPerDay: number;
  peakHour: number;
}

export function parseAfterHoursTimestamp(timestamp: string): Date | null {
  if (!timestamp || timestamp.trim() === '') return null;

  const match = timestamp.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(am|pm)$/i
  );

  if (!match) return null;

  const [, monthStr, day, year, hour, minute, second, meridiem] = match;

  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const month = monthMap[monthStr];
  if (month === undefined) return null;

  let hour24 = parseInt(hour, 10);
  if (meridiem.toLowerCase() === 'pm' && hour24 !== 12) {
    hour24 += 12;
  } else if (meridiem.toLowerCase() === 'am' && hour24 === 12) {
    hour24 = 0;
  }

  const date = new Date(parseInt(year, 10), month, parseInt(day, 10), hour24, parseInt(minute, 10), parseInt(second, 10));

  return isNaN(date.getTime()) ? null : date;
}

export function extractMemberNameFromPhone(memberWithPhone: string): { name: string; phone: string } {
  if (!memberWithPhone || memberWithPhone.trim() === '') {
    return { name: '', phone: '' };
  }

  const match = memberWithPhone.match(/^(.+?)\s*\(\+?(\d+)\)$/);

  if (match) {
    const [, name, phone] = match;
    return {
      name: name.trim(),
      phone: phone.trim(),
    };
  }

  return {
    name: memberWithPhone.trim(),
    phone: '',
  };
}

export function formatPhoneNumber(phone: string): string {
  if (!phone || phone.length < 10) return phone;

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
  }

  if (cleaned.length > 11) {
    return `+${cleaned.substring(0, cleaned.length - 10)} (${cleaned.substring(cleaned.length - 10, cleaned.length - 7)}) ${cleaned.substring(cleaned.length - 7, cleaned.length - 4)}-${cleaned.substring(cleaned.length - 4)}`;
  }

  return phone;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isLateNight(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour <= 6;
}

export function getCallHour(date: Date): number {
  return date.getHours();
}

export function calculateUrgencyScore(date: Date): number {
  let score = 5;

  if (isWeekend(date)) {
    score += 3;
  }

  const hour = date.getHours();
  if (hour >= 22 || hour <= 6) {
    score += 2;
  }

  if (hour >= 0 && hour <= 4) {
    score += 1;
  }

  return Math.min(10, score);
}

export function transformAfterHoursRow(row: ConciergeAfterHoursCSVRow): TransformedAfterHoursCall | null {
  const columns = Object.keys(row);
  if (columns.length === 0) return null;

  const timestamp = String(row[columns[0]] || '').trim();
  const memberWithPhone = String(row[columns[1]] || '').trim();
  const notes = columns[2] ? String(row[columns[2]] || '').trim() : undefined;

  if (!timestamp || timestamp === '') return null;

  const parsedDate = parseAfterHoursTimestamp(timestamp);
  if (!parsedDate) return null;

  if (!memberWithPhone || memberWithPhone === '') return null;

  const { name, phone } = extractMemberNameFromPhone(memberWithPhone);

  return {
    call_timestamp: timestamp,
    member_name_with_phone: memberWithPhone,
    member_name: name,
    phone_number: phone,
    notes: notes && notes !== '' && notes.toUpperCase() !== 'N/A' ? notes : undefined,
  };
}

export function transformAfterHoursFile(data: ConciergeAfterHoursCSVRow[]): TransformedAfterHoursCall[] {
  const results: TransformedAfterHoursCall[] = [];

  for (const row of data) {
    const transformed = transformAfterHoursRow(row);
    if (transformed) {
      results.push(transformed);
    }
  }

  return results;
}

export function validateAfterHoursCall(call: TransformedAfterHoursCall): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!call.call_timestamp || call.call_timestamp === '') {
    errors.push('Call timestamp is required');
  }

  if (!call.member_name || call.member_name === '') {
    errors.push('Member name is required');
  }

  const parsedDate = parseAfterHoursTimestamp(call.call_timestamp);
  if (!parsedDate) {
    errors.push(`Invalid timestamp format: ${call.call_timestamp}`);
  } else {
    const hour = parsedDate.getHours();
    if (hour >= 8 && hour < 20) {
      errors.push(`Call at ${call.call_timestamp} appears to be during business hours`);
    }
  }

  if (call.phone_number) {
    const cleaned = call.phone_number.replace(/\D/g, '');
    if (cleaned.length < 10) {
      errors.push(`Invalid phone number: ${call.phone_number}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getAfterHoursSummary(data: TransformedAfterHoursCall[]): AfterHoursSummary {
  let weekendCalls = 0;
  let lateNightCalls = 0;
  let earlyMorningCalls = 0;
  const hourCounts: Record<number, number> = {};
  const uniqueDates = new Set<string>();

  data.forEach(call => {
    const date = parseAfterHoursTimestamp(call.call_timestamp);
    if (!date) return;

    uniqueDates.add(date.toDateString());

    if (isWeekend(date)) {
      weekendCalls++;
    }

    const hour = date.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    if (hour >= 22 || hour === 0) {
      lateNightCalls++;
    }

    if (hour >= 1 && hour <= 6) {
      earlyMorningCalls++;
    }
  });

  const peakHour = Object.entries(hourCounts).reduce(
    (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour, 10), count } : max),
    { hour: 20, count: 0 }
  ).hour;

  return {
    totalCalls: data.length,
    weekendCalls,
    lateNightCalls,
    earlyMorningCalls,
    avgCallsPerDay: uniqueDates.size > 0 ? data.length / uniqueDates.size : 0,
    peakHour,
  };
}

export function groupCallsByDate(data: TransformedAfterHoursCall[]): Array<{ date: string; count: number; calls: TransformedAfterHoursCall[] }> {
  const grouped: Record<string, TransformedAfterHoursCall[]> = {};

  data.forEach(call => {
    const date = parseAfterHoursTimestamp(call.call_timestamp);
    if (!date) return;

    const dateKey = date.toISOString().split('T')[0];

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(call);
  });

  return Object.entries(grouped)
    .map(([date, calls]) => ({
      date,
      count: calls.length,
      calls,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function identifyHighPriorityCallers(
  data: TransformedAfterHoursCall[]
): Array<{ member: string; callCount: number; avgUrgency: number }> {
  const callerStats: Record<string, { count: number; totalUrgency: number }> = {};

  data.forEach(call => {
    const date = parseAfterHoursTimestamp(call.call_timestamp);
    if (!date) return;

    if (!callerStats[call.member_name]) {
      callerStats[call.member_name] = { count: 0, totalUrgency: 0 };
    }

    callerStats[call.member_name].count++;
    callerStats[call.member_name].totalUrgency += calculateUrgencyScore(date);
  });

  return Object.entries(callerStats)
    .filter(([, stats]) => stats.count > 1)
    .map(([member, stats]) => ({
      member,
      callCount: stats.count,
      avgUrgency: stats.totalUrgency / stats.count,
    }))
    .sort((a, b) => b.avgUrgency - a.avgUrgency || b.callCount - a.callCount);
}

export function analyzeResponsePatterns(data: TransformedAfterHoursCall[]): {
  hourDistribution: Array<{ hour: number; count: number; label: string }>;
  dayOfWeekDistribution: Array<{ day: string; count: number }>;
  peakTimes: string[];
} {
  const hourCounts: Record<number, number> = {};
  const dayOfWeekCounts: Record<string, number> = {};

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  data.forEach(call => {
    const date = parseAfterHoursTimestamp(call.call_timestamp);
    if (!date) return;

    const hour = date.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    const dayName = dayNames[date.getDay()];
    dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
  });

  const hourDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0,
    label: formatHourLabel(hour),
  }));

  const dayOfWeekDistribution = dayNames.map(day => ({
    day,
    count: dayOfWeekCounts[day] || 0,
  }));

  const sortedHours = Object.entries(hourCounts).sort(([, a], [, b]) => b - a);
  const peakTimes = sortedHours.slice(0, 3).map(([hour]) => formatHourLabel(parseInt(hour, 10)));

  return {
    hourDistribution,
    dayOfWeekDistribution,
    peakTimes,
  };
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function detectCallDuplicates(
  data: TransformedAfterHoursCall[]
): Array<{ call1: TransformedAfterHoursCall; call2: TransformedAfterHoursCall; minutesApart: number }> {
  const duplicates: Array<{ call1: TransformedAfterHoursCall; call2: TransformedAfterHoursCall; minutesApart: number }> = [];

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const date1 = parseAfterHoursTimestamp(data[i].call_timestamp);
      const date2 = parseAfterHoursTimestamp(data[j].call_timestamp);

      if (!date1 || !date2) continue;

      if (data[i].member_name === data[j].member_name) {
        const minutesApart = Math.abs(date1.getTime() - date2.getTime()) / 1000 / 60;

        if (minutesApart < 30) {
          duplicates.push({
            call1: data[i],
            call2: data[j],
            minutesApart,
          });
        }
      }
    }
  }

  return duplicates;
}
