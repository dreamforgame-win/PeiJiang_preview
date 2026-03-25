import LZString from 'lz-string';

export const generateShareCode = (data: any): string => {
  const jsonString = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(jsonString);
};

export const parseShareCode = (code: string): any => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(code);
    if (!decompressed) throw new Error("Invalid share code");
    return JSON.parse(decompressed);
  } catch (error) {
    console.error("Failed to parse share code:", error);
    throw new Error("解析分享码失败，请检查分享码是否正确");
  }
};
