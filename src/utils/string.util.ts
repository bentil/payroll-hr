export default class StringUtil {
  static render(template: string, params: Record<string, unknown>): string {
    let finalString: string = template;
    for (const key in params) {
      finalString = finalString.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        params[key] as string
      );
    }
    return finalString.trim();
  }

  static isEmpty(value: any) {
    return value == null || (typeof value === 'string' && value.trim().length === 0);
  }
}