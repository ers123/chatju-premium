/**
 * Mansae Calculator Wrapper
 * Handles ESM/CommonJS compatibility issues with manseryeok
 *
 * Enhanced with:
 * - True Solar Time (진태양시) correction based on birthplace longitude
 * - Southern Hemisphere (남반구) manseryeok support (reversed seasons)
 * - Korean timezone correction (Seoul ≈ UTC+8:28, not UTC+9)
 *
 * Note: Korea uses JST (UTC+9, 135°E meridian),
 * but Seoul (127°E) is ~28 minutes behind. For accurate 시주 calculation,
 * the birth time must be corrected to true local solar time.
 */

// Heavenly Stems (천간)
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const HEAVENLY_STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// Earthly Branches (지지)
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const EARTHLY_BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// Element mappings
const STEM_ELEMENT = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

const BRANCH_ELEMENT = {
  인: "목", 묘: "목", 사: "화", 오: "화",
  진: "토", 술: "토", 축: "토", 미: "토",
  신: "금", 유: "금", 해: "수", 자: "수",
};

const MONTH_BRANCHES = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"];

// Element names in English
const ELEMENT_NAMES = {
  목: 'Wood', 화: 'Fire', 토: 'Earth', 금: 'Metal', 수: 'Water'
};

/**
 * Korean Standard Time (KST) Historical Timeline
 *
 * Korea has changed its standard time multiple times. Using the wrong timezone
 * for the birth year produces incorrect solar time corrections (and thus wrong 시주).
 *
 * | Period              | UTC Offset | Standard Meridian | Seoul correction |
 * |---------------------|-----------|-------------------|-----------------|
 * | ~1908               | LMT       | Local Mean Time   | 0 min (solar)   |
 * | 1908-01-01~1911-12-31 | UTC+8:30  | 127.5°E          | -2 min          |
 * | 1912-01-01~1954-03-20 | UTC+9     | 135°E (JST, 일제) | -32 min         |
 * | 1954-03-21~1961-08-09 | UTC+8:30  | 127.5°E (독립 환원) | -2 min          |
 * | 1961-08-10~present    | UTC+9     | 135°E (재변경)    | -32 min         |
 *
 * The 1954-1961 period is critical: Korea reverted to UTC+8:30 after independence,
 * which almost exactly matches Seoul's longitude (127°E). Applying the modern
 * UTC+9 correction (-32 min) to births in this period would be WRONG.
 */

/**
 * Get the historical timezone offset for Korea based on birth date.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {number} UTC offset in hours (8.5 or 9)
 */
function getKoreaHistoricalTimezone(year, month, day) {
  // Before 1908: Local Mean Time (approximate as 8.5 since Seoul ≈ 127°E)
  if (year < 1908) return 8.5;

  // 1908-01-01 ~ 1911-12-31: UTC+8:30
  if (year < 1912) return 8.5;

  // 1912-01-01 ~ 1954-03-20: UTC+9 (Japanese Standard Time)
  if (year < 1954) return 9;
  if (year === 1954 && (month < 3 || (month === 3 && day <= 20))) return 9;

  // 1954-03-21 ~ 1961-08-09: UTC+8:30 (Korean Standard Time restored)
  if (year < 1961) return 8.5;
  if (year === 1961 && (month < 8 || (month === 8 && day <= 9))) return 8.5;

  // 1961-08-10 ~ present: UTC+9
  return 9;
}

/**
 * Check if a city name refers to a Korean location
 */
const KOREAN_CITIES = new Set([
  'seoul', '서울', 'busan', '부산', 'daegu', '대구', 'incheon', '인천',
  'gwangju', '광주', 'daejeon', '대전', 'jeju', '제주', 'ulsan', '울산',
  'suwon', '수원', 'changwon', '창원', 'goyang', '고양', 'yongin', '용인',
  'seongnam', '성남', 'cheongju', '청주', 'jeonju', '전주', 'chuncheon', '춘천',
  'wonju', '원주', 'gangneung', '강릉', 'pohang', '포항', 'gimhae', '김해',
  'iksan', '익산', 'pyeongtaek', '평택', 'gimpo', '김포',
  // North Korean cities (for historical births)
  'pyongyang', '평양', 'kaesong', '개성', 'hamhung', '함흥',
]);

/**
 * Known city longitudes for True Solar Time correction.
 * Standard meridians: UTC+9 = 135°E, UTC+8:30 = 127.5°E, UTC+8 = 120°E, etc.
 * Formula: correction_minutes = (actual_longitude - standard_meridian) × 4
 *
 * Example: Seoul (127°E) in UTC+9 zone (135°E standard)
 *   → (127 - 135) × 4 = -32 minutes
 *   → A baby born at 14:00 KST was actually born at ~13:28 solar time
 *
 * But in 1954-1961 (UTC+8:30, 127.5°E standard):
 *   → (127 - 127.5) × 4 = -2 minutes (almost no correction needed!)
 *
 * NOTE: The `tz` field here is the CURRENT timezone. For Korean cities,
 * the actual historical timezone is resolved dynamically by birth year
 * via getKoreaHistoricalTimezone().
 */
const KNOWN_LOCATIONS = {
  // Korea — tz is modern default; overridden by getKoreaHistoricalTimezone() at runtime
  'seoul':      { lat: 37.57, lng: 127.00, tz: 9, country: 'KR' },
  '서울':       { lat: 37.57, lng: 127.00, tz: 9, country: 'KR' },
  'busan':      { lat: 35.18, lng: 129.08, tz: 9, country: 'KR' },
  '부산':       { lat: 35.18, lng: 129.08, tz: 9, country: 'KR' },
  'daegu':      { lat: 35.87, lng: 128.60, tz: 9, country: 'KR' },
  '대구':       { lat: 35.87, lng: 128.60, tz: 9, country: 'KR' },
  'incheon':    { lat: 37.46, lng: 126.71, tz: 9, country: 'KR' },
  '인천':       { lat: 37.46, lng: 126.71, tz: 9, country: 'KR' },
  'gwangju':    { lat: 35.16, lng: 126.85, tz: 9, country: 'KR' },
  '광주':       { lat: 35.16, lng: 126.85, tz: 9, country: 'KR' },
  'daejeon':    { lat: 36.35, lng: 127.38, tz: 9, country: 'KR' },
  '대전':       { lat: 36.35, lng: 127.38, tz: 9, country: 'KR' },
  'jeju':       { lat: 33.50, lng: 126.53, tz: 9, country: 'KR' },
  '제주':       { lat: 33.50, lng: 126.53, tz: 9, country: 'KR' },
  'ulsan':      { lat: 35.54, lng: 129.31, tz: 9, country: 'KR' },
  '울산':       { lat: 35.54, lng: 129.31, tz: 9, country: 'KR' },
  'suwon':      { lat: 37.26, lng: 127.03, tz: 9, country: 'KR' },
  '수원':       { lat: 37.26, lng: 127.03, tz: 9, country: 'KR' },
  // North Korea
  'pyongyang':  { lat: 39.02, lng: 125.75, tz: 9, country: 'KR' },
  '평양':       { lat: 39.02, lng: 125.75, tz: 9, country: 'KR' },
  'kaesong':    { lat: 37.97, lng: 126.56, tz: 9, country: 'KR' },
  '개성':       { lat: 37.97, lng: 126.56, tz: 9, country: 'KR' },
  // Japan (UTC+9 — no historical changes since 1888)
  'tokyo':      { lat: 35.68, lng: 139.69, tz: 9 },
  '도쿄':       { lat: 35.68, lng: 139.69, tz: 9 },
  'osaka':      { lat: 34.69, lng: 135.50, tz: 9 },
  // China (UTC+8, standard meridian 120°E — unified since 1949)
  'beijing':    { lat: 39.90, lng: 116.40, tz: 8 },
  '베이징':     { lat: 39.90, lng: 116.40, tz: 8 },
  'shanghai':   { lat: 31.23, lng: 121.47, tz: 8 },
  'hong kong':  { lat: 22.32, lng: 114.17, tz: 8 },
  '홍콩':       { lat: 22.32, lng: 114.17, tz: 8 },
  'taipei':     { lat: 25.03, lng: 121.57, tz: 8 },
  '타이베이':   { lat: 25.03, lng: 121.57, tz: 8 },
  // USA (standard time — DST not handled; user should provide clock time as-is)
  'new york':   { lat: 40.71, lng: -74.01, tz: -5 },
  'los angeles': { lat: 34.05, lng: -118.24, tz: -8 },
  'chicago':    { lat: 41.88, lng: -87.63, tz: -6 },
  'houston':    { lat: 29.76, lng: -95.37, tz: -6 },
  // Europe
  'london':     { lat: 51.51, lng: -0.13, tz: 0 },
  '런던':       { lat: 51.51, lng: -0.13, tz: 0 },
  'paris':      { lat: 48.86, lng: 2.35, tz: 1 },
  'berlin':     { lat: 52.52, lng: 13.41, tz: 1 },
  // Southeast Asia
  'singapore':  { lat: 1.35, lng: 103.82, tz: 8 },
  '싱가포르':   { lat: 1.35, lng: 103.82, tz: 8 },
  'bangkok':    { lat: 13.76, lng: 100.50, tz: 7 },
  'hanoi':      { lat: 21.03, lng: 105.85, tz: 7 },
  '하노이':     { lat: 21.03, lng: 105.85, tz: 7 },
  // Southern Hemisphere
  'sydney':     { lat: -33.87, lng: 151.21, tz: 10 },
  '시드니':     { lat: -33.87, lng: 151.21, tz: 10 },
  'melbourne':  { lat: -37.81, lng: 144.96, tz: 10 },
  'buenos aires': { lat: -34.60, lng: -58.38, tz: -3 },
  'sao paulo':  { lat: -23.55, lng: -46.63, tz: -3 },
  '상파울루':   { lat: -23.55, lng: -46.63, tz: -3 },
  'cape town':  { lat: -33.92, lng: 18.42, tz: 2 },
  'auckland':   { lat: -36.85, lng: 174.76, tz: 12 },
  'santiago':   { lat: -33.45, lng: -70.67, tz: -4 },
  'lima':       { lat: -12.05, lng: -77.04, tz: -5 },
  'jakarta':    { lat: -6.21, lng: 106.85, tz: 7 },
};

/**
 * Calculate True Solar Time (진태양시) correction in minutes.
 *
 * @param {number} longitude - Birthplace longitude (-180 to 180)
 * @param {number} timezoneOffset - UTC offset in hours (e.g., 9 for KST)
 * @returns {number} Correction in minutes (negative = subtract from clock time)
 */
function getSolarTimeCorrection(longitude, timezoneOffset) {
  const standardMeridian = timezoneOffset * 15; // Each hour = 15° of longitude
  return (longitude - standardMeridian) * 4;    // Each degree = 4 minutes of time
}

/**
 * Resolve birthplace to location data (latitude, longitude, timezone offset).
 * For Korean cities, the timezone is dynamically resolved based on birth year
 * to account for historical KST changes (UTC+8:30 vs UTC+9).
 *
 * @param {Object} options - Location options
 * @param {string} [options.birthPlace] - City name (Korean or English)
 * @param {number} [options.latitude] - Direct latitude
 * @param {number} [options.longitude] - Direct longitude
 * @param {number} [options.timezoneOffset] - UTC offset in hours (overrides auto-detection)
 * @param {number} [options.birthYear] - Birth year (for Korean historical TZ)
 * @param {number} [options.birthMonth] - Birth month (for Korean historical TZ)
 * @param {number} [options.birthDay] - Birth day (for Korean historical TZ)
 * @returns {Object|null} { lat, lng, tz, historicalTzNote? } or null if unresolvable
 */
function resolveLocation(options = {}) {
  const { birthPlace, latitude, longitude, timezoneOffset, birthYear, birthMonth, birthDay } = options;

  // Direct coordinates take priority
  if (latitude != null && longitude != null) {
    const tz = timezoneOffset != null ? timezoneOffset : Math.round(longitude / 15);
    return { lat: latitude, lng: longitude, tz };
  }

  // Look up by city name
  if (birthPlace) {
    const key = birthPlace.toLowerCase().trim();
    let found = KNOWN_LOCATIONS[key] || null;

    // Partial match fallback
    if (!found) {
      for (const [name, loc] of Object.entries(KNOWN_LOCATIONS)) {
        if (key.includes(name) || name.includes(key)) {
          found = loc;
          break;
        }
      }
    }

    if (found) {
      // For Korean cities: override tz with historical value based on birth year
      const isKorean = found.country === 'KR' || KOREAN_CITIES.has(key);
      if (isKorean && birthYear) {
        const historicalTz = getKoreaHistoricalTimezone(birthYear, birthMonth || 1, birthDay || 1);
        if (historicalTz !== found.tz) {
          return {
            ...found,
            tz: historicalTz,
            historicalTzNote: `${birthYear}년 출생 → 당시 한국 표준시 UTC+${historicalTz} 적용 (현재 UTC+9와 다름)`,
          };
        }
      }
      return { ...found };
    }
  }

  return null; // Unknown location — no correction applied
}

/**
 * Adjust birth time to True Solar Time based on birthplace longitude.
 * Returns adjusted { year, month, day, hour, minute } — the date may shift
 * if correction crosses midnight.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @param {Object|null} location - { lat, lng, tz }
 * @returns {Object} { year, month, day, hour, minute, correctionMinutes, isSouthernHemisphere }
 */
function adjustToSolarTime(year, month, day, hour, minute, location) {
  if (!location) {
    return {
      year, month, day, hour, minute,
      correctionMinutes: 0,
      isSouthernHemisphere: false,
    };
  }

  const correctionMinutes = Math.round(getSolarTimeCorrection(location.lng, location.tz));
  const isSouthernHemisphere = location.lat < 0;

  // Apply correction
  let totalMinutes = hour * 60 + minute + correctionMinutes;
  let dayShift = 0;

  if (totalMinutes < 0) {
    dayShift = -1;
    totalMinutes += 24 * 60;
  } else if (totalMinutes >= 24 * 60) {
    dayShift = 1;
    totalMinutes -= 24 * 60;
  }

  const adjustedHour = Math.floor(totalMinutes / 60);
  const adjustedMinute = totalMinutes % 60;

  // Adjust date if correction crosses midnight
  let adjustedDate = new Date(year, month - 1, day + dayShift);

  return {
    year: adjustedDate.getFullYear(),
    month: adjustedDate.getMonth() + 1,
    day: adjustedDate.getDate(),
    hour: adjustedHour,
    minute: adjustedMinute,
    correctionMinutes,
    isSouthernHemisphere,
  };
}

/**
 * Solar Terms (節氣) - Approximate dates for each year
 * Month pillar is determined by solar terms, NOT by Gregorian calendar
 *
 * 1월(寅月): 입춘(立春) ~2/4 ~ 경칩 ~3/6
 * 2월(卯月): 경칩(驚蟄) ~3/6 ~ 청명 ~4/5
 * 3월(辰月): 청명(清明) ~4/5 ~ 입하 ~5/6
 * 4월(巳月): 입하(立夏) ~5/6 ~ 망종 ~6/6
 * 5월(午月): 망종(芒種) ~6/6 ~ 소서 ~7/7
 * 6월(未月): 소서(小暑) ~7/7 ~ 입추 ~8/8
 * 7월(申月): 입추(立秋) ~8/8 ~ 백로 ~9/8
 * 8월(酉月): 백로(白露) ~9/8 ~ 한로 ~10/8
 * 9월(戌月): 한로(寒露) ~10/8 ~ 입동 ~11/7
 * 10월(亥月): 입동(立冬) ~11/7 ~ 대설 ~12/7
 * 11월(子月): 대설(大雪) ~12/7 ~ 소한 ~1/6
 * 12월(丑月): 소한(小寒) ~1/6 ~ 입춘 ~2/4
 */

// Solar terms start dates (month, day) - approximate, varies by year ±1 day
const SOLAR_TERMS = [
  { month: 2, day: 4 },   // 입춘 - 寅月 start (month index 0)
  { month: 3, day: 6 },   // 경칩 - 卯月 start (month index 1)
  { month: 4, day: 5 },   // 청명 - 辰月 start (month index 2)
  { month: 5, day: 6 },   // 입하 - 巳月 start (month index 3)
  { month: 6, day: 6 },   // 망종 - 午月 start (month index 4)
  { month: 7, day: 7 },   // 소서 - 未月 start (month index 5)
  { month: 8, day: 8 },   // 입추 - 申月 start (month index 6)
  { month: 9, day: 8 },   // 백로 - 酉月 start (month index 7)
  { month: 10, day: 8 },  // 한로 - 戌月 start (month index 8)
  { month: 11, day: 7 },  // 입동 - 亥月 start (month index 9)
  { month: 12, day: 7 },  // 대설 - 子月 start (month index 10)
  { month: 1, day: 6 },   // 소한 - 丑月 start (month index 11)
];

/**
 * Get lunar month index (0-11) based on solar terms
 * 0 = 寅月, 1 = 卯月, 2 = 辰月, ... 11 = 丑月
 *
 * Note: Solar terms typically occur in the afternoon/evening of the listed date,
 * so we treat the boundary day as belonging to the PREVIOUS term.
 * The new term effectively starts the day AFTER the listed date.
 */
function getLunarMonthIndex(gMonth, gDay) {
  // Find which term period we're in
  // We go backwards from the end of the list to find the most recent term

  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    const term = SOLAR_TERMS[i];

    // Handle year wrap-around for January (소한)
    if (term.month === 1) {
      if (gMonth === 1 && gDay > term.day) {
        return 11; // 丑月 (after 소한)
      }
      continue; // Skip January term when checking other months
    }

    // Handle December (대설)
    if (term.month === 12) {
      if (gMonth === 12 && gDay > term.day) {
        return 10; // 子月 (after 대설)
      }
      if (gMonth === 1) {
        // Still in 子月 from previous year's 대설
        return 10;
      }
      continue;
    }

    // For months Feb-Nov: new term starts the day AFTER the listed date
    // Use > instead of >= so the boundary day belongs to previous term
    if (gMonth > term.month || (gMonth === term.month && gDay > term.day)) {
      return i;
    }
  }

  // If nothing matched, we're before 입춘 = still in 丑月 from previous year
  return 11; // 丑月
}

/**
 * Calculate year pillar based on lunar year cycle
 */
function calculateYearPillar(year) {
  const cycleIndex = ((year - 4) % 60 + 60) % 60;
  const stemIndex = cycleIndex % 10;
  const branchIndex = cycleIndex % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemHanja: HEAVENLY_STEMS_HANJA[stemIndex],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIndex],
    element: STEM_ELEMENT[HEAVENLY_STEMS[stemIndex]],
  };
}

/**
 * Calculate month pillar based on SOLAR TERMS (節氣)
 * The month pillar is determined by which solar term period the date falls into,
 * NOT by the Gregorian calendar month.
 *
 * @param {number} gMonth - Gregorian month (1-12)
 * @param {number} gDay - Gregorian day (1-31)
 * @param {number} yearStemIndex - Index of year's heavenly stem (0-9)
 * @param {number} year - Year (needed to determine which year's stem to use)
 */
function calculateMonthPillar(gMonth, gDay, yearStemIndex, year, isSouthernHemisphere = false) {
  // Get lunar month index based on solar terms
  let lunarMonthIndex = getLunarMonthIndex(gMonth, gDay);

  // Southern Hemisphere: reverse seasonal energy by 6 months
  if (isSouthernHemisphere) {
    lunarMonthIndex = getSouthernHemisphereMonthIndex(lunarMonthIndex);
  }
  const branch = MONTH_BRANCHES[lunarMonthIndex];
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);

  // For dates before 입춘, use previous year's stem
  let effectiveYearStemIndex = yearStemIndex;
  if (gMonth === 1 || (gMonth === 2 && gDay < 4)) {
    // Before 입춘, still previous year
    effectiveYearStemIndex = (yearStemIndex - 1 + 10) % 10;
  }

  // Calculate month stem based on year stem
  // 갑/기년 → 병인월 시작 (stem index 2)
  // 을/경년 → 무인월 시작 (stem index 4)
  // 병/신년 → 경인월 시작 (stem index 6)
  // 정/임년 → 임인월 시작 (stem index 8)
  // 무/계년 → 갑인월 시작 (stem index 0)
  const yearStemGroup = effectiveYearStemIndex % 5;
  const firstMonthStem = [2, 4, 6, 8, 0][yearStemGroup];
  const stemIndex = (firstMonthStem + lunarMonthIndex) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: branch,
    stemHanja: HEAVENLY_STEMS_HANJA[stemIndex],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIndex],
    element: STEM_ELEMENT[HEAVENLY_STEMS[stemIndex]],
    lunarMonthIndex, // For debugging
  };
}

/**
 * Calculate day pillar using Julian Day Number
 */
function calculateDayPillar(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const cycleIndex = ((jdn + 49) % 60 + 60) % 60;
  const stemIndex = cycleIndex % 10;
  const branchIndex = cycleIndex % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemHanja: HEAVENLY_STEMS_HANJA[stemIndex],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIndex],
    element: STEM_ELEMENT[HEAVENLY_STEMS[stemIndex]],
  };
}

/**
 * Calculate hour pillar
 */
function calculateHourPillar(hour, dayStemIndex) {
  let branchIndex;
  if (hour >= 23 || hour < 1) {
    branchIndex = 0;
  } else {
    branchIndex = Math.floor((hour + 1) / 2);
  }

  const dayStemGroup = dayStemIndex % 5;
  const firstHourStem = [0, 2, 4, 6, 8][dayStemGroup];
  const stemIndex = (firstHourStem + branchIndex) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    stemHanja: HEAVENLY_STEMS_HANJA[stemIndex],
    branchHanja: EARTHLY_BRANCHES_HANJA[branchIndex],
    element: STEM_ELEMENT[HEAVENLY_STEMS[stemIndex]],
  };
}

/**
 * Calculate element distribution
 */
function calculateElements(pillars) {
  const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  ['year', 'month', 'day', 'hour'].forEach(key => {
    const pillar = pillars[key];
    if (pillar) {
      const stemEl = STEM_ELEMENT[pillar.stem];
      if (stemEl) elements[stemEl]++;
      const branchEl = BRANCH_ELEMENT[pillar.branch];
      if (branchEl) elements[branchEl]++;
    }
  });

  return elements;
}

/**
 * Get Southern Hemisphere month index by reversing the seasonal cycle.
 * In the Southern Hemisphere, seasons are opposite:
 *   Northern 寅月 (spring/Feb) → Southern 申月 (autumn/Aug), offset by 6
 *
 * Reference: 남반구 만세력 — when birth occurs in Southern Hemisphere,
 * the month pillar uses the opposite season's energy.
 *
 * @param {number} lunarMonthIndex - Northern hemisphere month index (0-11)
 * @returns {number} Adjusted month index for Southern Hemisphere
 */
function getSouthernHemisphereMonthIndex(lunarMonthIndex) {
  return (lunarMonthIndex + 6) % 12;
}

/**
 * Main calculation function - enhanced with solar time & hemisphere correction
 *
 * @param {string} birthDate - YYYY-MM-DD
 * @param {string} birthTime - HH:MM
 * @param {string} gender - '남' or '여'
 * @param {Object} [locationOptions] - Optional location for corrections
 * @param {string} [locationOptions.birthPlace] - City name
 * @param {number} [locationOptions.latitude] - Latitude
 * @param {number} [locationOptions.longitude] - Longitude
 * @param {number} [locationOptions.timezoneOffset] - UTC offset in hours
 */
function calculateMansae(birthDate, birthTime, gender, locationOptions = {}) {
  try {
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute = 0] = birthTime.split(':').map(Number);

    // Step 0: Resolve location and apply True Solar Time correction
    // Pass birth date for Korean historical timezone detection (UTC+8:30 vs UTC+9)
    const location = resolveLocation({
      ...locationOptions,
      birthYear: year,
      birthMonth: month,
      birthDay: day,
    });
    const adjusted = adjustToSolarTime(year, month, day, hour, minute, location);
    const isSouthernHemisphere = adjusted.isSouthernHemisphere;

    // Use adjusted values for all pillar calculations
    const calcYear = adjusted.year;
    const calcMonth = adjusted.month;
    const calcDay = adjusted.day;
    const calcHour = adjusted.hour;

    // Calculate four pillars using corrected time
    const yearPillar = calculateYearPillar(calcYear);
    const yearStemIndex = HEAVENLY_STEMS.indexOf(yearPillar.stem);

    // Month pillar uses solar terms, not Gregorian month
    // For Southern Hemisphere: reverse the seasonal month index
    const monthPillar = calculateMonthPillar(calcMonth, calcDay, yearStemIndex, calcYear, isSouthernHemisphere);
    const dayPillar = calculateDayPillar(calcYear, calcMonth, calcDay);
    const dayStemIndex = HEAVENLY_STEMS.indexOf(dayPillar.stem);
    const hourPillar = calculateHourPillar(calcHour, dayStemIndex);

    // Build pillars object with format expected by both frontend and daeun.service.js
    const pillars = {
      year: {
        heavenlyStem: yearPillar.stem,
        earthlyBranch: yearPillar.branch,
        stem: yearPillar.stem,           // For daeun.service.js compatibility
        branch: yearPillar.branch,       // For daeun.service.js compatibility
        element: `${STEM_ELEMENT[yearPillar.stem]} + ${BRANCH_ELEMENT[yearPillar.branch]}`,
        korean: yearPillar.stem + yearPillar.branch,
        hanja: yearPillar.stemHanja + yearPillar.branchHanja,
      },
      month: {
        heavenlyStem: monthPillar.stem,
        earthlyBranch: monthPillar.branch,
        stem: monthPillar.stem,          // For daeun.service.js compatibility
        branch: monthPillar.branch,      // For daeun.service.js compatibility
        element: `${STEM_ELEMENT[monthPillar.stem]} + ${BRANCH_ELEMENT[monthPillar.branch]}`,
        korean: monthPillar.stem + monthPillar.branch,
        hanja: monthPillar.stemHanja + monthPillar.branchHanja,
      },
      day: {
        heavenlyStem: dayPillar.stem,
        earthlyBranch: dayPillar.branch,
        stem: dayPillar.stem,            // For daeun.service.js compatibility
        branch: dayPillar.branch,        // For daeun.service.js compatibility
        element: `${STEM_ELEMENT[dayPillar.stem]} + ${BRANCH_ELEMENT[dayPillar.branch]}`,
        korean: dayPillar.stem + dayPillar.branch,
        hanja: dayPillar.stemHanja + dayPillar.branchHanja,
      },
      hour: {
        heavenlyStem: hourPillar.stem,
        earthlyBranch: hourPillar.branch,
        stem: hourPillar.stem,           // For daeun.service.js compatibility
        branch: hourPillar.branch,       // For daeun.service.js compatibility
        element: `${STEM_ELEMENT[hourPillar.stem]} + ${BRANCH_ELEMENT[hourPillar.branch]}`,
        korean: hourPillar.stem + hourPillar.branch,
        hanja: hourPillar.stemHanja + hourPillar.branchHanja,
      },
    };

    // Calculate elements
    const rawElements = calculateElements({
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    });

    const elements = {
      wood: rawElements.목,
      fire: rawElements.화,
      earth: rawElements.토,
      metal: rawElements.금,
      water: rawElements.수,
    };

    // Day master (일간)
    const dayMaster = dayPillar.stem;

    return {
      pillars,
      elements,
      dayMaster,
      gender,
      input: {
        birthDate,
        birthTime,
        gender,
      },
      // Solar time & hemisphere correction metadata
      corrections: {
        applied: !!location,
        solarTimeCorrection: adjusted.correctionMinutes,
        isSouthernHemisphere,
        adjustedTime: location ? `${String(calcHour).padStart(2, '0')}:${String(adjusted.minute).padStart(2, '0')}` : null,
        adjustedDate: location && (calcYear !== year || calcMonth !== month || calcDay !== day)
          ? `${calcYear}-${String(calcMonth).padStart(2, '0')}-${String(calcDay).padStart(2, '0')}`
          : null,
        birthPlace: locationOptions.birthPlace || null,
        historicalTzNote: location?.historicalTzNote || null,
        note: location
          ? `진태양시 보정 ${adjusted.correctionMinutes > 0 ? '+' : ''}${adjusted.correctionMinutes}분${isSouthernHemisphere ? ' (남반구 만세력 적용)' : ''}${location.historicalTzNote ? ` — ${location.historicalTzNote}` : ''}`
          : '출생지 미입력 — 보정 없음 (한국 출생이라면 서울 기준 약 -32분 보정 권장)',
      },
    };
  } catch (error) {
    console.error('[Mansae Wrapper] Calculation error:', error);
    return { error: error.message };
  }
}

module.exports = {
  calculateMansae,
  resolveLocation,
  getSolarTimeCorrection,
  getKoreaHistoricalTimezone,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  KNOWN_LOCATIONS,
};
