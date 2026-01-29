import { customerCreateSchema } from '@/lib/validation';

describe('customerCreateSchema', () => {
  describe('customerTypes', () => {
    it('空配列の場合はエラーになる', () => {
      const result = customerCreateSchema.safeParse({
        name: 'テスト株式会社',
        customerTypes: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const customerTypesError = result.error.issues.find(
          (issue) => issue.path.includes('customerTypes')
        );
        expect(customerTypesError).toBeDefined();
        expect(customerTypesError?.message).toBe('顧客タイプを1つ以上選択してください');
      }
    });

    it('1つ以上の顧客タイプが選択されていれば成功', () => {
      const result = customerCreateSchema.safeParse({
        name: 'テスト株式会社',
        customerTypes: ['CLIENT'],
      });

      expect(result.success).toBe(true);
    });

    it('複数の顧客タイプが選択されていても成功', () => {
      const result = customerCreateSchema.safeParse({
        name: 'テスト株式会社',
        customerTypes: ['CLIENT', 'REFERRER'],
      });

      expect(result.success).toBe(true);
    });

    it('無効な顧客タイプの場合はエラーになる', () => {
      const result = customerCreateSchema.safeParse({
        name: 'テスト株式会社',
        customerTypes: ['INVALID'],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('name', () => {
    it('名前が空の場合はエラーになる', () => {
      const result = customerCreateSchema.safeParse({
        name: '',
        customerTypes: ['CLIENT'],
      });

      expect(result.success).toBe(false);
    });

    it('名前が入力されていれば成功', () => {
      const result = customerCreateSchema.safeParse({
        name: 'テスト株式会社',
        customerTypes: ['CLIENT'],
      });

      expect(result.success).toBe(true);
    });
  });
});
