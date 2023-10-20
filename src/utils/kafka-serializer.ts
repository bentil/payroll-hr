export class KafkaSerializer {
  static encode(value: any): Buffer | string | null {
    if (value !== undefined && value !== null 
            && typeof value !== 'string' && !Buffer.isBuffer(value)) {
      if (Array.isArray(value) || typeof value === 'object') {
        return JSON.stringify(value);
      } else {
        return value.toString();
      }
    } else if (value === undefined) {
      return null;
    }

    return value;
  }
}