/**
 * Generates a unique code with a specific prefix.
 * Example: generateUniqueCode('JAB') -> 'JAB-A1B2'
 */
export const generateUniqueCode = (prefix: string): string => {
  // Generate a random string of 4 alphanumeric characters
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomStr}`;
};

/**
 * Generates an acronym or short slug from a given text.
 * Filters out common Indonesian conjunctions/prepositions.
 */
export const getAcronymOrSlug = (text: string, defaultPrefix: string): string => {
  if (!text || !text.trim()) return defaultPrefix;

  const stopWords = new Set(['dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'kelas', 'surat']);
  const words = text
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) return defaultPrefix;

  if (words.length === 1) {
    const single = words[0].toUpperCase();
    return single.length <= 4 ? single : single.substring(0, 3);
  }

  if (words.length === 2) {
    const [w1, w2] = words;
    // e.g. "Matematika Wajib" -> "MAT-W" or "Wali Kelas" -> "WK"
    if (w1.length > 3 && w2.length <= 4) {
      return `${w1.substring(0, 3).toUpperCase()}-${w2.toUpperCase()}`;
    }
    return `${w1[0]}${w2[0]}`.toUpperCase();
  }

  // 3 or more words -> take initial of each word, e.g. "Ilmu Pengetahuan Alam" -> "IPA"
  return words.map(w => w[0]).join('').substring(0, 5).toUpperCase();
};

/**
 * Smart code generator for Jurusan (Majors)
 * Example: "Rekayasa Perangkat Lunak" -> "RPL-A1B2", "Farmasi" -> "FAR-A1B2"
 */
export const generateMajorCode = (name?: string): string => {
  const prefix = name ? getAcronymOrSlug(name, 'JUR') : 'JUR';
  return generateUniqueCode(prefix);
};

/**
 * Smart code generator for Tingkat / Grade
 * Example: educationLevel="SMA", level=10 -> "SMA-10-A1B2" or "KLS-10-A1B2"
 */
export const generateGradeCode = (educationLevel?: string, level?: number | string, name?: string): string => {
  if (level) {
    const prefix = educationLevel ? `${educationLevel}-${level}` : `KLS-${level}`;
    return generateUniqueCode(prefix);
  }
  if (name) {
    const cleanName = name.replace(/\s+/g, '-').toUpperCase();
    return generateUniqueCode(cleanName);
  }
  return generateUniqueCode(educationLevel || 'TK');
};

/**
 * Smart code generator for Mata Pelajaran (Subjects)
 * Example: "Matematika Wajib" -> "MAT-W-A1B2", "Fisika" -> "FIS-A1B2"
 */
export const generateSubjectCode = (name?: string): string => {
  const prefix = name ? getAcronymOrSlug(name, 'MAPEL') : 'MAPEL';
  return generateUniqueCode(prefix);
};

/**
 * Smart code generator for Jam Pelajaran (Class Periods)
 * Example: periodNumber=1, isBreak=false -> "JP-01-A1B2", isBreak=true -> "IST-01-A1B2"
 */
export const generatePeriodCode = (periodNumber?: number | string, isBreak?: boolean): string => {
  const padNum = periodNumber ? String(periodNumber).padStart(2, '0') : '01';
  const prefix = isBreak ? `IST-${padNum}` : `JP-${padNum}`;
  return generateUniqueCode(prefix);
};

/**
 * Smart code generator for Jabatan (Positions)
 * Example: "Kepala Sekolah" -> "KS-A1B2", "Tata Usaha" -> "TU-A1B2", "Bendahara" -> "BEN-A1B2"
 */
export const generatePositionCode = (name?: string): string => {
  const prefix = name ? getAcronymOrSlug(name, 'JAB') : 'JAB';
  return generateUniqueCode(prefix);
};

/**
 * Smart code generator for Template Surat (Letter Templates)
 * Example: category="KETERANGAN", name="Aktif Siswa" -> "SK-AKTIF-A1B2"
 */
export const generateLetterTemplateCode = (category?: string, name?: string): string => {
  const categoryMap: Record<string, string> = {
    KETERANGAN: 'SK',
    PANGGILAN: 'SP',
    UNDANGAN: 'SU',
    UMUM: 'SRT',
  };

  const catPrefix = (category && categoryMap[category.toUpperCase()]) || 'SRT';
  if (name) {
    const slug = getAcronymOrSlug(name, '');
    const prefix = slug ? `${catPrefix}-${slug}` : catPrefix;
    return generateUniqueCode(prefix);
  }
  return generateUniqueCode(catPrefix);
};
