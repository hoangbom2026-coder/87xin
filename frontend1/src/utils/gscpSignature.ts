import md5 from 'md5';

/**
 * Tạo chữ ký MD5 theo tài liệu GSC+
 * Signature format: md5(operator_code + request_time + "action_name" + secret_key)
 * Lưu ý: Mỗi API có thứ tự tham số khác nhau, cần kiểm tra kỹ.
 */
export const generateGSCPSignature = (
  operatorCode: string,
  requestTime: number | string,
  action: string,
  secretKey: string
): string => {
  const data = `${operatorCode}${requestTime}${action}${secretKey}`;
  return md5(data);
};
